// 허브(SB-01) 화면 모델과 주간 글 인라인 검사
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readJSON } from './_load.mjs';
import { hubModel, normalizeWeekly } from '../assets/hub.js';
import { inlineWeekly } from '../scripts/inline-weekly.mjs';

const copy = readJSON('data/copy.ko.json');
const labels = { monthDay: '{m}월 {d}일' };
const sample = { title: '제목', slug: 'week-01', donguiLine: '한 줄', readMin: 3, publishedAt: '2026-11-12' };

test('도구 카드 노출 순서: 건강 체크 → 상속·증여 → 내 나이 달력', () => {
  const m = hubModel(copy, null, labels);
  assert.deepEqual(m.tools.map((t) => t.id), ['health', 'estate', 'calendar']);
  assert.deepEqual(m.tools.map((t) => t.n), [1, 2, 3]);
  assert.ok(m.tools.every((t) => !t.path.startsWith('/')), '상대 경로');
});

test('히어로·보조문은 확정 카피 그대로', () => {
  const m = hubModel(copy, null, labels);
  assert.equal(m.hero, copy.hub.hero);
  assert.equal(m.sub, copy.hub.sub);
});

test('주간 글이 없거나 필드가 빠지면 영역 숨김(null)', () => {
  assert.equal(hubModel(copy, null, labels).weekly, null);
  for (const k of ['title', 'slug', 'donguiLine', 'readMin']) {
    const w = { ...sample }; delete w[k];
    assert.equal(normalizeWeekly(w), null, k);
  }
  assert.equal(normalizeWeekly({ ...sample, title: '  ' }), null);
  assert.equal(normalizeWeekly({ ...sample, slug: '../x' }), null);
  assert.equal(normalizeWeekly({ ...sample, readMin: 0 }), null);
});

test('주간 글 카드: 읽는 시간·동의보감 한 줄·경로', () => {
  const w = hubModel(copy, sample, labels).weekly;
  assert.equal(w.readMore, copy.hub.readMore.replace('{min}', '3'));
  assert.equal(w.dongui, `${copy.newsletter.donguiLabel} · 한 줄`);
  assert.equal(w.path, 'diary/week-01/');
  assert.equal(w.dateLabel, '11월 12일');
  assert.equal(hubModel(copy, { ...sample, publishedAt: undefined }, labels).weekly.dateLabel, null);
});

test('inlineWeekly: index.html 자리에 넣고, </script> 를 이스케이프한다', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const out = inlineWeekly(html, { ...sample, title: '</script><b>x' });
  const m = /<script type="application\/json" id="weekly-data">([\s\S]*?)<\/script>/.exec(out);
  assert.ok(!m[1].includes('</'));
  assert.equal(JSON.parse(m[1]).title, '</script><b>x');
  assert.match(inlineWeekly(html, null), /id="weekly-data"><\/script>/);
});

test('저장소의 index.html 은 주간 글 자리가 비어 있거나 유효한 JSON 이다', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const m = /<script type="application\/json" id="weekly-data">([\s\S]*?)<\/script>/.exec(html);
  assert.ok(m);
  if (m[1].trim()) assert.ok(normalizeWeekly(JSON.parse(m[1])));
});

test('허브에는 공유 버튼이 없고, 실행 중 요청·저장 코드가 없다', () => {
  const src = ['index.js', 'assets/hub.js'].map((f) => readFileSync(join(ROOT, f), 'utf8')).join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/shareButton/.test(src));
  for (const bad of [/\bfetch\s*\(/, /XMLHttpRequest/, /sendBeacon/, /localStorage/, /sessionStorage/, /indexedDB/, /document\.cookie/, /URLSearchParams/]) {
    assert.ok(!bad.test(src), String(bad));
  }
});

test('허브 head 의 공유 미리보기 문구가 확정 카피와 같다', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  assert.ok(html.includes(`content="${copy.hub.sub}"`));
  assert.ok(html.includes(`<title>${copy.brand.siteName}</title>`));
});
