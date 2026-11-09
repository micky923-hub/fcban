// tests/age-calendar.cases.json 을 그대로 읽어 검사한다(통합 C1–C5 + 검진 홀짝 + 연금 개시 나이).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readJSON } from './_load.mjs';
import { ageCalendar, checkupEligible, pensionStartAge, daysBetween } from '../assets/ageCalendar.js';

const rules = readJSON('data/ageRules.json');
const copy = readJSON('data/copy.ko.json');
const data = readJSON('tests/age-calendar.cases.json');
const opts = { rowCopy: copy.calendar.result.rows };

/** expect 에 적힌 키만 비교한다(케이스마다 기대값 범위가 다르다). */
function assertSubset(actual, expected, path = '') {
  for (const [k, v] of Object.entries(expected)) {
    if (k === 'note' || k === 'rowsOrder') continue;
    if (v !== null && typeof v === 'object') assertSubset(actual?.[k], v, `${path}${k}.`);
    else assert.equal(actual?.[k], v, `${path}${k}`);
  }
}

for (const c of data.cases) {
  test(`${c.id} ${c.birth} @ ${c.base}`, () => {
    const r = ageCalendar(c.birth, c.base, rules, opts);
    assertSubset(r, c.expect);
    if (c.expect.rowsOrder) assert.deepEqual(r.rows.map((x) => x.key), c.expect.rowsOrder, 'rowsOrder');
  });
}

for (const c of data.checkupParity) {
  test(`검진 홀짝 ${c.birthYear}년생 · ${c.year}년 → ${c.eligible}`, () => {
    assert.equal(checkupEligible(c.birthYear, c.year, rules), c.eligible);
  });
}

for (const c of data.pensionStartAge) {
  test(`연금 개시 나이 ${c.birthYear}년생 → ${c.age}세`, () => {
    assert.equal(pensionStartAge(c.birthYear, rules), c.age);
  });
}

test('D-day 는 기준일 미포함 일수 차이 (_meta.note)', () => {
  assert.equal(daysBetween('2026-11-09', '2027-02-03'), 86);
});

// ── rowsRule 공통 조건: 모든 케이스에 적용 ──
test('rows: 기준일 이후만 · 오름차순 · 최대 5행 · 강조는 올해 검진 첫 행만', () => {
  const births = ['1900-01-01', '1952-12-31', '1960-01-15', '1963-05-10', '1966-12-25', '1974-02-03', '1980-08-31', '1996-02-29', '2006-03-01', '2026-11-09'];
  const bases = ['2026-11-09', '2027-01-01', '2028-02-29', '2031-12-25'];
  for (const b of births) for (const base of bases) {
    if (b > base) continue;
    const r = ageCalendar(b, base, rules, opts);
    assert.ok(r.rows.length <= 5);
    const dates = r.rows.map((x) => x.date);
    const rest = r.rows.filter((x) => x.key !== 'checkupThisYear').map((x) => x.date);
    assert.deepEqual(rest, [...rest].sort(), '오름차순');
    assert.ok(dates.every((d) => d >= base), `${b}@${base}`);
    r.rows.forEach((row, i) => assert.equal(row.highlight, row.key === 'checkupThisYear' && i === 0));
    assert.ok(r.rows.every((row) => row.title && row.sub && !/\{\w+\}/.test(row.title + row.sub)), '자리표시자 미치환');
  }
});

test('생일 당일은 D-0, 출생 당일은 다음 해 생일', () => {
  assert.equal(ageCalendar('1974-02-03', '2027-02-03', rules).daysToBirthday, 0);
  assert.equal(ageCalendar('2026-11-09', '2026-11-09', rules).nextBirthday, '2027-11-09');
});

test('연금 개시가 65세가 아니면 65세 행 보조문에서 국민연금 부분을 뺀다', () => {
  const c3 = ageCalendar('1966-12-25', '2026-11-09', rules, opts);
  const age65 = c3.rows.find((x) => x.key === 'age65');
  assert.ok(!age65.sub.includes('국민연금'));
  const c1 = ageCalendar('1974-02-03', '2026-11-09', rules, opts);
  assert.equal(c1.rows.find((x) => x.key === 'age65').sub, copy.calendar.result.rows.age65.sub);
});

test('달력 페이지 head 의 공유 미리보기 문구가 확정 카피와 같다', () => {
  const html = readFileSync(join(ROOT, 'calendar/index.html'), 'utf8');
  assert.ok(html.includes(`content="${copy.calendar.share}"`), 'og:description');
  assert.ok(html.includes(`content="${copy.calendar.title}"`), 'og:title');
});

test('달력 화면 코드에 서버 전송·저장 경로가 없다', () => {
  const src = ['calendar/calendar.js', 'assets/ui.js', 'assets/ageCalendar.js'].map((f) => readFileSync(join(ROOT, f), 'utf8')).join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, ''); // 주석 제외
  for (const bad of [/\bfetch\s*\(/, /XMLHttpRequest/, /sendBeacon/, /localStorage/, /sessionStorage/, /indexedDB/, /document\.cookie/, /<form[^>]+action=/, /URLSearchParams/]) {
    assert.ok(!bad.test(src), String(bad));
  }
});
