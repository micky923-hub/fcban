// tests/estate.cases.json(상속 7 · 증여 5 · 구간 경계 6)을 그대로 읽어 검사한다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readJSON } from './_load.mjs';
import { estateEstimate, taxForBase, estimateRange, formatKRW, parseEok, parseCount } from '../assets/estate.js';

const rules = readJSON('data/taxRules.json');
const data = readJSON('tests/estate.cases.json');

function check(r, e) {
  if (e.specialCase) return assert.equal(r.specialCase, e.specialCase);
  assert.equal(r.deductionTotal, e.deductionTotal, 'deductionTotal');
  assert.equal(r.taxableBase, e.taxableBase, 'taxableBase');
  if ('zeroTax' in e) assert.equal(r.zeroTax, e.zeroTax, 'zeroTax');
  if ('rate' in e) assert.equal(r.bracket.rate, e.rate, 'rate');
  if ('calculatedTax' in e) assert.equal(r.calculatedTax, e.calculatedTax, 'calculatedTax');
}

for (const c of data.inheritance) {
  test(`상속 ${c.id} ${c.asset / 1e8}억 · 배우자 ${c.spouse ? '있음' : '없음'} · 자녀 ${c.children}`, () => {
    check(estateEstimate({ kind: 'inheritance', asset: c.asset, spouse: c.spouse, children: c.children, minors: c.minors }, rules), c.expect);
  });
}

for (const c of data.gift) {
  test(`증여 ${c.id} ${c.amount / 1e8}억 · ${c.relation}${c.marriageBirth ? ' · 혼인·출산' : ''}`, () => {
    check(estateEstimate({ kind: 'gift', amount: c.amount, relation: c.relation, marriageBirth: c.marriageBirth }, rules), c.expect);
  });
}

for (const c of data.bracketBoundary) {
  test(`구간 경계 과세표준 ${c.taxableBase.toLocaleString()} → ${c.rate * 100}%`, () => {
    const t = taxForBase(c.taxableBase, rules);
    assert.equal(t.rate, c.rate);
    if ('calculatedTax' in c) assert.equal(t.calculatedTax, c.calculatedTax);
  });
}

test('케이스 수: 상속 7 · 증여 5 · 경계 6', () => {
  assert.deepEqual([data.inheritance.length, data.gift.length, data.bracketBoundary.length], [7, 5, 6]);
});

test('혼인·출산 공제는 자녀(직계비속) 증여에만 더한다', () => {
  const r = estateEstimate({ kind: 'gift', amount: 700000000, relation: 'spouse', marriageBirth: true }, rules);
  assert.equal(r.deductionTotal, 600000000);
});

test('자녀가 많으면 기초 2억 + 인적공제가 일괄공제보다 커진다', () => {
  const r = estateEstimate({ kind: 'inheritance', asset: 2e9, spouse: false, children: 7, minors: 0 }, rules);
  assert.equal(r.deductionTotal, 550000000);
  assert.deepEqual(r.deductionParts.map((p) => p.key), ['basic', 'personal']);
});

test('세액 범위 표기: SB-08 예시 3천만 원 → 2천만 ~ 3천만', () => {
  assert.deepEqual(estimateRange(30000000, rules), [20000000, 30000000]);
  assert.deepEqual(estimateRange(240000000, rules), [230000000, 240000000]);
  assert.deepEqual(estimateRange(10000000, rules), [9000000, 10000000], 'G2: 0 ~ 1천만 이 되지 않는다');
  assert.deepEqual(estimateRange(1000000, rules), [900000, 1000000]);
  assert.deepEqual(estimateRange(0, rules), [0, 0]);
});

test('금액 표기', () => {
  assert.equal(formatKRW(1000000000), '10억');
  assert.equal(formatKRW(250000000), '2억 5천만');
  assert.equal(formatKRW(30000000), '3천만');
  assert.equal(formatKRW(5000000), '500만');
  assert.equal(formatKRW(123400000000), '1,234억');
  assert.equal(formatKRW(0), '0');
});

test('입력 해석: 억 원 소수 1자리, 0.1–999', () => {
  const ir = rules.input;
  assert.equal(parseEok('12', ir), 1200000000);
  assert.equal(parseEok('0.1', ir), 10000000);
  assert.equal(parseEok('12.5', ir), 1250000000);
  assert.equal(parseEok('999', ir), 99900000000);
  for (const bad of ['', '0', '0.05', '12.55', '1000', '-1', 'abc', '1e3']) assert.equal(parseEok(bad, ir), null, bad);
  assert.equal(parseCount('2', 20), 2);
  assert.equal(parseCount('21', 20), null);
  assert.equal(parseCount('-1', 20), null);
});

test('상속·증여 head 의 공유 미리보기 문구가 확정 카피와 같다', async () => {
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { ROOT } = await import('./_load.mjs');
  const copy = readJSON('data/copy.ko.json');
  const html = readFileSync(join(ROOT, 'estate/index.html'), 'utf8');
  assert.ok(html.includes(`content="${copy.estate.share}"`));
  assert.ok(html.includes(`content="${copy.estate.title}"`));
});
