// 상속·증여 간이 계산 (SB-07/08) — 순수 함수만 둔다. DOM 을 쓰지 않는다.
// 금액은 모두 원 단위 정수. 세율·공제·표시 규칙은 호출자가 넘기는 rules(data/taxRules.json)에서만 읽는다.

const EOK = 100000000; // 1억 = 10^8 — 단위 환산용(세법 상수 아님)
const MAN = 10000;     // 1만

/** 과세표준 → 적용 구간·산출세액 (과세표준 × 세율 − 누진공제) */
export function taxForBase(base, rules) {
  const brackets = rules.rateTable.brackets;
  const idx = brackets.findIndex((b) => b.upTo === null || base <= b.upTo);
  const b = brackets[idx];
  const ratePct = Math.round(b.rate * 100);
  const calculatedTax = base > 0 ? Math.round((base * ratePct) / 100) - b.progressiveDeduction : 0;
  return {
    index: idx,
    rate: b.rate,
    progressiveDeduction: b.progressiveDeduction,
    lower: idx === 0 ? null : brackets[idx - 1].upTo, // 초과
    upper: b.upTo,                                      // 이하
    calculatedTax,
  };
}

/**
 * @param {{kind:'inheritance', asset:number, spouse:boolean, children:number, minors:number}
 *        |{kind:'gift', amount:number, relation:string, marriageBirth:boolean}} input
 * @returns 공제 합계·과세표준·구간·산출세액, 또는 { specialCase:'noChildNoSpouse' }
 */
export function estateEstimate(input, rules) {
  let total;
  let deductionTotal;
  let parts;
  if (input.kind === 'inheritance') {
    const r = rules.inheritance;
    if (!input.spouse && input.children === 0) return { kind: input.kind, specialCase: 'noChildNoSpouse' };
    // 인적공제: 자녀 1인당 공제만 반영. 미성년 가산은 자녀 나이가 필요해 생략(최소 기준) — OPEN_QUESTIONS Q22
    const personal = input.children * r.personalDeductions.perChild;
    const itemized = r.basicDeduction + personal;
    const useLump = r.lumpSumDeduction >= itemized;
    parts = useLump
      ? [{ key: 'lumpSum', amount: r.lumpSumDeduction }]
      : [{ key: 'basic', amount: r.basicDeduction }, { key: 'personal', amount: personal }];
    if (input.spouse) parts.push({ key: 'spouseMin', amount: r.spouseDeduction.minimum });
    total = input.asset;
  } else {
    const g = rules.gift;
    const relDeduction = g.tenYearDeductionByRelation[input.relation];
    if (relDeduction === undefined) throw new Error(`relation: ${input.relation}`);
    parts = [{ key: `rel:${input.relation}`, amount: relDeduction }];
    // 혼인·출산 공제는 직계존속 → 직계비속 증여에만 해당
    if (input.marriageBirth && input.relation.startsWith('linealDescendant')) {
      parts.push({ key: 'marriageBirth', amount: g.marriageBirthDeduction.amount });
    }
    total = input.amount;
  }
  deductionTotal = parts.reduce((a, p) => a + p.amount, 0);
  const taxableBase = Math.max(0, total - deductionTotal);
  const t = taxForBase(taxableBase, rules);
  return {
    kind: input.kind,
    total,
    deductionTotal,
    deductionParts: parts,
    taxableBase,
    zeroTax: taxableBase <= 0,
    bracket: taxableBase > 0 ? { rate: t.rate, progressiveDeduction: t.progressiveDeduction, lower: t.lower, upper: t.upper } : null,
    calculatedTax: t.calculatedTax,
  };
}

/** 예상 세액 범위 [하한, 상한] — rules.displayRules.estimateRange */
export function estimateRange(tax, rules) {
  if (tax <= 0) return [0, 0];
  const er = rules.displayRules.estimateRange;
  const unitFor = (x) => er.units.find((u) => x >= u) ?? er.units[er.units.length - 1];
  const lowRaw = Math.round((tax * Math.round((1 - er.reportCreditRate) * 10000)) / 10000);
  const low = Math.floor(lowRaw / unitFor(lowRaw)) * unitFor(lowRaw);
  const high = Math.ceil(tax / unitFor(tax)) * unitFor(tax);
  return [low, high];
}

/** 천만 단위 반올림 (displayRules.roundToUnit) */
export const roundDisplay = (n, rules) => Math.round(n / rules.displayRules.roundToUnit) * rules.displayRules.roundToUnit;

/** 원 → '2억 5천만', '3천만', '500만', '0' (단위 접미사 없이) */
export function formatKRW(n) {
  if (n === 0) return '0';
  const eok = Math.floor(n / EOK);
  const man = Math.round((n % EOK) / MAN);
  const out = [];
  if (eok) out.push(`${eok.toLocaleString('en-US')}억`);
  if (man) out.push(man % 1000 === 0 ? `${man / 1000}천만` : `${man.toLocaleString('en-US')}만`);
  return out.join(' ') || '0';
}

/** 억 원 입력 문자열 → 원 정수 (형식·범위가 틀리면 null). 부동소수점 없이 0.1억 단위 정수로 계산 */
export function parseEok(text, inputRules) {
  const s = String(text).trim().replace(/,/g, '');
  const dec = inputRules.amountDecimals;
  if (!new RegExp(`^\\d{1,4}(\\.\\d{1,${dec}})?$`).test(s)) return null;
  const [i, f = ''] = s.split('.');
  const scale = 10 ** dec;
  const units = Number(i) * scale + Number(f.padEnd(dec, '0'));
  const min = Math.round(inputRules.amountEokMin * scale);
  const max = Math.round(inputRules.amountEokMax * scale);
  if (units < min || units > max) return null;
  return (units * EOK) / scale;
}

/** 0..max 정수 문자열 → 정수, 아니면 null */
export function parseCount(text, max) {
  const s = String(text).trim();
  if (!/^\d{1,2}$/.test(s)) return null;
  const n = Number(s);
  return n <= max ? n : null;
}
