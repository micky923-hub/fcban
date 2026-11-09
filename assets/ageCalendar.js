// 내 나이 달력 계산 (SB-04) — 순수 함수만 둔다. DOM·Date 객체·전역 상태를 쓰지 않는다.
// 날짜는 모두 'YYYY-MM-DD' 문자열이며, 연산은 정수 연월일로만 한다(타임존 영향 없음).
// 상수는 호출자가 넘겨주는 rules(data/ageRules.json)에서만 읽는다.

// ── 날짜 기본 연산 ─────────────────────────────────────────────

const pad2 = (n) => String(n).padStart(2, '0');
const pad4 = (n) => String(n).padStart(4, '0');

/** 'YYYY-MM-DD' → { y, m, d } (형식이 틀리면 null) */
export function parseISO(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

export const toISO = (y, m, d) => `${pad4(y)}-${pad2(m)}-${pad2(d)}`;

export const isLeapYear = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

export function daysInMonth(y, m) {
  if (m === 2) return isLeapYear(y) ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

/** 실제 존재하는 날짜인지 */
export function isValidISO(iso) {
  const p = parseISO(iso);
  return !!p && p.m >= 1 && p.m <= 12 && p.d >= 1 && p.d <= daysInMonth(p.y, p.m);
}

/** 연·월에 일(day)을 맞추되, 그 달 말일을 넘으면 말일로 보정 */
function clampDate(y, m, d) {
  return toISO(y, m, Math.min(d, daysInMonth(y, m)));
}

/** 월 더하기 + 말일 보정 (8/31 + 6개월 = 2/28 또는 2/29) */
export function addMonthsClamped(y, m, d, months) {
  const idx = y * 12 + (m - 1) + months;
  return clampDate(Math.floor(idx / 12), (idx % 12) + 1, d);
}

/** 그레고리력 날짜 → 1970-01-01 기준 일수 (정수 연산) */
function dayNumber(iso) {
  const { y, m, d } = parseISO(iso);
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const mp = (m + 9) % 12;
  const doy = Math.floor((153 * mp + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** b − a 일수 (기준일 미포함: 2026-11-09 → 2027-02-03 = 86) */
export const daysBetween = (aISO, bISO) => dayNumber(bISO) - dayNumber(aISO);

/** 해당 연도의 생일. 2/29 출생자는 평년에 2/28 */
export function birthdayInYear(birth, year) {
  return clampDate(year, birth.m, birth.d);
}

/** 해당 생일 연도의 상령일 = 그 해 생일 + N개월 (출생일 기준 일자로 말일 보정) */
function insuranceChangeForYear(birth, year, months) {
  return addMonthsClamped(year, birth.m, birth.d, months);
}

// ── 만 나이 · 보험나이 ─────────────────────────────────────────

/** 만 나이: 기준일이 그 해 생일 전이면 1 차감 */
export function fullAge(birthISO, baseISO) {
  const b = parseISO(birthISO);
  const base = parseISO(baseISO);
  let age = base.y - b.y;
  if (baseISO < birthdayInYear(b, base.y)) age -= 1;
  return age;
}

/**
 * 보험나이: 마지막 생일 + N개월(rules.insuranceAge.roundUpAtMonths) <= 기준일 이면 만 나이 + 1.
 * 상령일 당일은 올림. 다음 상령일 = 기준일 이후(당일 제외) 가장 가까운 "생일 + N개월".
 * @returns {{ fullAge:number, insAge:number, nextChangeISO:string }}
 */
export function insuranceAge(birthISO, baseISO, rules) {
  const months = rules?.insuranceAge?.roundUpAtMonths;
  if (!Number.isInteger(months)) throw new Error('rules.insuranceAge.roundUpAtMonths 가 필요합니다');
  const b = parseISO(birthISO);
  const age = fullAge(birthISO, baseISO);
  const lastBirthdayYear = b.y + age;
  const change = insuranceChangeForYear(b, lastBirthdayYear, months);
  const passed = change <= baseISO;
  return {
    fullAge: age,
    insAge: passed ? age + 1 : age,
    nextChangeISO: passed ? insuranceChangeForYear(b, lastBirthdayYear + 1, months) : change,
  };
}

// ── 국가건강검진 ───────────────────────────────────────────────

/** 출생연도와 연도의 홀짝이 같고, 그 해 나이(연도 − 출생연도)가 minAge 이상이면 대상 */
export function checkupEligible(birthYear, year, rules) {
  const hc = rules.healthCheckup;
  if (year - birthYear < hc.minAge) return false;
  return hc.parityCycle ? (year - birthYear) % 2 === 0 : true;
}

/** 기준 연도 다음 해부터 처음 대상이 되는 연도 */
export function nextCheckupYear(birthYear, baseYear, rules) {
  let y = baseYear + 1;
  while (!checkupEligible(birthYear, y, rules)) y += 1;
  return y;
}

// ── 국민연금 ───────────────────────────────────────────────────

export function pensionStartAge(birthYear, rules) {
  const row = rules.nationalPension.startAgeByBirthYear.find((r) => birthYear >= r.from && birthYear <= r.to);
  return row ? row.age : null;
}

/** 개시 나이 생일(startDate)과 수령 시작 달(startMonth: 'YYYY-MM') */
export function pensionStart(birthISO, rules) {
  const b = parseISO(birthISO);
  const startAge = pensionStartAge(b.y, rules);
  if (startAge === null) return null;
  const startDate = birthdayInYear(b, b.y + startAge);
  const sd = parseISO(startDate);
  const monthISO = rules.nationalPension.startsFromNextMonth
    ? addMonthsClamped(sd.y, sd.m, 1, 1)
    : toISO(sd.y, sd.m, 1);
  return { startAge, startDate, startMonth: monthISO.slice(0, 7), startMonthFirstDay: monthISO };
}

// ── 문구 채우기 ────────────────────────────────────────────────

/** '{key}' 자리표시자 치환 */
export function fill(template, vars) {
  return String(template).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

// ── 통합 ───────────────────────────────────────────────────────

/**
 * @param {string} birthISO
 * @param {string} baseISO
 * @param {object} rules  data/ageRules.json
 * @param {object} [opts]
 * @param {object} [opts.rowCopy]  copy.calendar.result.rows (있으면 title/sub 를 채운다)
 * @param {{even:string, odd:string}} [opts.parityWords]  검진 행 '{parity}' 자리 단어
 * @param {number} [opts.maxRows=5]
 */
export function ageCalendar(birthISO, baseISO, rules, opts = {}) {
  const { rowCopy = null, parityWords = { even: 'even', odd: 'odd' }, maxRows = 5 } = opts;
  const b = parseISO(birthISO);
  const base = parseISO(baseISO);

  // 만 나이 · 다음 생일 (출생 당일 자체는 '다음 생일'이 아니다)
  const ins = insuranceAge(birthISO, baseISO, rules);
  let nextBirthday = birthdayInYear(b, base.y);
  if (nextBirthday < baseISO || nextBirthday <= birthISO) nextBirthday = birthdayInYear(b, base.y + 1);

  const eligibleThisYear = checkupEligible(b.y, base.y, rules);
  const nextYear = nextCheckupYear(b.y, base.y, rules);

  const pension = pensionStart(birthISO, rules);
  const age65Age = rules.age65.age;
  const age65Date = birthdayInYear(b, b.y + age65Age);
  const pensionAt65 = pension !== null && pension.startAge === age65Age;

  const result = {
    fullAge: ins.fullAge,
    nextBirthday,
    daysToBirthday: daysBetween(baseISO, nextBirthday),
    insurance: {
      age: ins.insAge,
      nextChange: ins.nextChangeISO,
      daysToChange: daysBetween(baseISO, ins.nextChangeISO),
    },
    checkup: { eligibleThisYear, nextYear },
    pension: pension && { startAge: pension.startAge, startDate: pension.startDate, startMonth: pension.startMonth },
    age65: { date: age65Date, pensionStartsSameTime: pensionAt65 },
    rows: [],
  };

  const t = (key, vars) => {
    if (!rowCopy || !rowCopy[key]) return { title: null, sub: null };
    return { title: fill(rowCopy[key].title, vars), sub: fill(rowCopy[key].sub, vars) };
  };

  const rows = [];
  if (eligibleThisYear) {
    const parity = b.y % 2 === 0 ? parityWords.even : parityWords.odd;
    rows.push({ key: 'checkupThisYear', date: toISO(base.y, 12, 31), year: base.y, highlight: true, ...t('checkupThisYear', { parity }) });
  }
  rows.push({
    key: 'insuranceChange',
    date: ins.nextChangeISO,
    highlight: false,
    info: true,
    ...t('insuranceChange', { from: ins.insAge, to: ins.insAge + 1, days: result.insurance.daysToChange }),
  });
  rows.push({ key: 'checkupNext', date: toISO(nextYear, 1, 1), year: nextYear, highlight: false, ...t('checkupNext', {}) });

  // 국민연금 개시가 65세와 같으면 65세 행 하나로 합친다(SB-03 C1). 다르면 각각 표시(C3).
  if (pension && !pensionAt65) {
    const [yyyy, mm] = pension.startMonth.split('-');
    rows.push({
      key: 'pensionStart',
      date: pension.startMonthFirstDay,
      month: pension.startMonth,
      highlight: false,
      ...t('pensionStart', { age: pension.startAge, yyyy, m: Number(mm) }),
    });
  }
  const age65Row = { key: 'age65', date: age65Date, highlight: false, ...t('age65', {}) };
  // 65세 보조문은 '국민연금 수령 시작 · 기초연금 신청 연령' — 연금 개시가 65세가 아니면 뒷부분만 쓴다.
  if (age65Row.sub && !pensionAt65) {
    const parts = age65Row.sub.split(' · ');
    age65Row.sub = parts[parts.length - 1];
  }
  rows.push(age65Row);

  // 올해 검진은 '지금 해당'하는 항목이라 12.31 마감일과 관계없이 첫 행에 고정한다(SB-03).
  const rank = (r) => (r.key === 'checkupThisYear' ? '' : r.date);
  result.rows = rows
    .filter((r) => r.date >= baseISO)
    .sort((a, c) => (rank(a) < rank(c) ? -1 : rank(a) > rank(c) ? 1 : 0))
    .slice(0, maxRows);
  return result;
}
