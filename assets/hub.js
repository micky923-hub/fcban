// 허브(SB-01) 화면 모델 — 순수 함수. DOM 을 쓰지 않는다.
import { pensionStartAge } from './ageCalendar.js';
import { formatKRW } from './estate.js';

/** '{key}' 자리표시자 치환 */
const fill = (t, v) => String(t).replace(/\{(\w+)\}/g, (_, k) => (k in v ? String(v[k]) : `{${k}}`));

/**
 * '올해 알아둘 숫자' 카드 — 확정 데이터(ageRules·taxRules)와 연도만으로 계산한다. 개인 입력값 없음.
 * 순서 고정: 국가건강검진 → 국민연금 시작 → 만 65세 → 증여공제. 해당 연도에 값이 없는 카드는 뺀다
 * (예: 2028년은 국민연금을 새로 받기 시작하는 출생연도가 없다).
 * @param {number} year  기준 연도(브라우저 로컬 날짜의 연도)
 * @param {{copy:object, ageRules:object, taxRules:object, parityWords:{even:string, odd:string}}} ctx
 * @returns {{id:string, tool:string, figure:string, title:string, sub:string, source:string}[]}
 */
export function yearNumbers(year, { copy, ageRules, taxRules, parityWords }) {
  const N = copy.hub.numbers;
  const cards = [];

  const hc = ageRules.healthCheckup;
  if (hc.parityCycle) {
    const parity = year % 2 === 0 ? parityWords.even : parityWords.odd;
    cards.push({ id: 'checkup', tool: 'health', figure: fill(N.checkup.figure, { parity }), title: N.checkup.title, sub: fill(N.checkup.sub, { year, parity }), source: hc.source });
  }

  // 올해 개시 나이가 되는 출생연도: 출생연도 + 개시 나이 = 올해
  const np = ageRules.nationalPension;
  const starter = np.startAgeByBirthYear
    .map((r) => ({ birthYear: year - r.age, age: r.age }))
    .find(({ birthYear, age }) => pensionStartAge(birthYear, ageRules) === age);
  if (starter) cards.push({ id: 'pension', tool: 'calendar', figure: fill(N.pension.figure, starter), title: N.pension.title, sub: fill(N.pension.sub, starter), source: np.source });

  const a65 = ageRules.age65;
  cards.push({ id: 'age65', tool: 'calendar', figure: fill(N.age65.figure, { birthYear: year - a65.age }), title: N.age65.title, sub: N.age65.sub, source: a65.source });

  const g = taxRules.gift;
  const money = { adult: formatKRW(g.tenYearDeductionByRelation.linealDescendant_adult), minor: formatKRW(g.tenYearDeductionByRelation.linealDescendant_minor) };
  cards.push({ id: 'gift', tool: 'estate', figure: fill(N.gift.figure, money), title: N.gift.title, sub: fill(N.gift.sub, money), source: g.source });

  return cards;
}

/**
 * content/weekly.json 한 건을 검사한다. 필수 필드가 하나라도 없으면 null(영역 숨김 — 빈 카드 금지).
 * 형식: { title, slug, donguiLine, readMin, publishedAt?, weekLabel?, summary? } — scripts/build.mjs 가 만든다
 */
export function normalizeWeekly(w) {
  if (!w || typeof w !== 'object') return null;
  const title = typeof w.title === 'string' ? w.title.trim() : '';
  const slug = typeof w.slug === 'string' ? w.slug.trim() : '';
  const donguiLine = typeof w.donguiLine === 'string' ? w.donguiLine.trim() : '';
  const readMin = Number(w.readMin);
  if (!title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !donguiLine || !Number.isInteger(readMin) || readMin < 1) return null;
  const publishedAt = typeof w.publishedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(w.publishedAt) ? w.publishedAt : null;
  const weekLabel = typeof w.weekLabel === 'string' && w.weekLabel.trim() ? w.weekLabel.trim() : null;
  return { title, slug, donguiLine, readMin, publishedAt, weekLabel };
}

/**
 * @param {object} copy   copy.ko.json
 * @param {object|null} weeklyRaw  content/weekly.json 내용(없으면 null)
 * @param {object} [extra]  { year, ageRules, taxRules, parityWords, channelUrl } — 있으면 '올해 알아둘 숫자'·'만든 사람'을 만든다
 */
export function hubModel(copy, weeklyRaw, extra = null) {
  const w = normalizeWeekly(weeklyRaw);
  const toolPath = (id) => copy.hub.tools.find((t) => t.id === id).path.replace(/^\//, '');
  const cards = extra ? yearNumbers(extra.year, { copy, ...extra }) : [];
  const channel = extra?.channelUrl ? String(extra.channelUrl).replace(/\/+$/, '') : '';
  return {
    numbers: cards.length ? {
      label: fill(copy.hub.numbersLabel, { year: extra.year }),
      cards: cards.map((c) => ({ ...c, path: toolPath(c.tool) })),
      // 국민연금 시기를 보여 줄 때는 조건 고지문을 함께 둔다(OPEN_QUESTIONS Q1)
      note: cards.some((c) => c.id === 'pension') ? copy.disclaimer.pension : null,
    } : null,
    operator: extra ? {
      label: copy.hub.operatorLabel,
      name: copy.brand.byline,
      text: copy.hub.operatorText,
      chat: channel ? { label: copy.hub.operatorChat, url: `${channel}/chat` } : null,
    } : null,
    hero: copy.hub.hero,
    sub: copy.hub.sub,
    weekly: w && {
      label: copy.hub.weeklyLabel,
      dateLabel: w.weekLabel, // 예: '11월 2주' (SB-01/09)
      title: w.title,
      path: `diary/${w.slug}/`,
      dongui: `${copy.newsletter.donguiLabel} · ${w.donguiLine}`,
      readMore: fill(copy.hub.readMore, { min: w.readMin }),
    },
    toolsLabel: copy.hub.toolsLabel,
    // 노출 순서 고정: copy.hub.tools 배열 순서(건강 체크 → 상속·증여 → 내 나이 달력)
    tools: copy.hub.tools.map((t, i) => ({ n: i + 1, id: t.id, title: t.title, sub: t.sub, path: t.path.replace(/^\//, '') })),
    channelLabel: copy.hub.kakaoAdd,
  };
}
