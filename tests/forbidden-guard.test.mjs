// 순서 6(ops/filter) 전까지 쓰는 임시 검사: 직접 작성한 코드·화면과, 화면에 렌더하는 확정 카피에
// data/forbidden-words.json 1군 단어·패턴이 없는지 확인한다. 화이트리스트를 먼저 지운 뒤 검사한다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT, readJSON } from './_load.mjs';

const dict = readJSON('data/forbidden-words.json');
const copy = readJSON('data/copy.ko.json');

export function tier1Hits(text) {
  let t = String(text);
  for (const w of [...dict.whitelist.words].sort((a, b) => b.length - a.length)) t = t.split(w).join(' ');
  const hits = dict.tier1_block.words.filter((w) => t.includes(w));
  for (const p of dict.tier1_block.patterns) {
    const m = t.match(new RegExp(p, 'g'));
    if (m) hits.push(...m);
  }
  return hits;
}

// 생성물·원본 데이터 복사본(운영자 확정 파일)은 제외하고, 직접 작성한 파일만 본다.
const SKIP = new Set(['assets/copy.ko.json', 'assets/copy.ko.data.js', 'assets/ageRules.json', 'assets/ageRules.data.js', 'assets/healthData.data.js', 'assets/taxRules.json', 'assets/taxRules.data.js']);
const DIRS = ['assets', 'calendar', 'health', 'estate', 'scripts', 'tests', 'ops'];
function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(m?js|html|css|json)$/.test(name)) yield p;
  }
}

const ROOT_FILES = ['index.html', 'index.js'].map((f) => join(ROOT, f)).filter(existsSync);

test('직접 작성한 코드·화면에 1군 단어가 없다', () => {
  for (const f of [...ROOT_FILES, ...DIRS.flatMap((d) => [...walk(join(ROOT, d))])]) {
    const rel = relative(ROOT, f);
    if (SKIP.has(rel)) continue;
    assert.deepEqual(tier1Hits(readFileSync(f, 'utf8')), [], rel);
  }
});

// 달력·허브·건강 체크·상속증여 화면이 렌더하는 카피 경로
const RENDERED = ['brand', 'disclaimer', 'calendar', 'hub', 'newsletter', 'health', 'estate'];
const get = (o, path) => path.split('.').reduce((a, k) => a[k], o);

for (const path of RENDERED) {
  test(`렌더하는 카피 copy.${path} 에 1군 단어가 없다`, () => {
    assert.deepEqual(tier1Hits(JSON.stringify(get(copy, path))), []);
  });
}

test('검사기 자체 확인: 화이트리스트 단어는 통과, 1군 패턴은 검출', () => {
  assert.deepEqual(tier1Hits('보험나이와 상령일, 국민건강보험공단'), []);
  assert.ok(tier1Hits(dict.tier1_block.words[0]).length > 0);
});

test('상속·증여 화면이 렌더하는 taxRules 문구에 1군 단어가 없다', () => {
  const tax = readJSON('data/taxRules.json');
  assert.deepEqual(tier1Hits([tax.inheritance.noChildNoSpouseText, tax.displayRules.externalLink.label].join(' ')), []);
});
