// 허브(SB-01) 화면 모델과 주간 글 인라인 검사
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readJSON } from './_load.mjs';
import { hubModel, normalizeWeekly, yearNumbers } from '../assets/hub.js';
import { inlineWeekly } from '../scripts/inline-weekly.mjs';

const copy = readJSON('data/copy.ko.json');
const ageRules = readJSON('data/ageRules.json');
const taxRules = readJSON('data/taxRules.json');
const parityWords = { even: '짝수', odd: '홀수' };
const ctx = { copy, ageRules, taxRules, parityWords };
const byId = (cards) => Object.fromEntries(cards.map((c) => [c.id, c]));

test('올해 알아둘 숫자 2026: 짝수년생 검진 · 1963년생 국민연금 63세 · 1961년생 65세 · 성인 자녀 5천만', () => {
  const cards = yearNumbers(2026, ctx);
  assert.deepEqual(cards.map((c) => c.id), ['checkup', 'pension', 'age65', 'gift']);
  const c = byId(cards);
  assert.equal(c.checkup.figure, '짝수년생');
  assert.equal(c.checkup.sub, '2026년은 짝수 해에 태어난 분이 대상입니다 · 12.31까지');
  assert.equal(c.pension.figure, '1963년생');
  assert.equal(c.pension.sub, '63세 생일 다음 달부터 받습니다');
  assert.equal(c.age65.figure, '1961년생');
  assert.equal(c.gift.figure, '5천만 원');
  assert.equal(c.gift.sub, '10년 합산 기준입니다 · 미성년 자녀는 2천만 원');
});

test('올해 알아둘 숫자: 홀수 해 · 국민연금 새 시작 출생연도가 없는 해는 카드 생략', () => {
  assert.equal(byId(yearNumbers(2027, ctx)).checkup.figure, '홀수년생');
  assert.equal(byId(yearNumbers(2027, ctx)).pension.figure, '1964년생'); // 1961–1964년생 63세
  assert.equal(byId(yearNumbers(2028, ctx)).pension, undefined); // 1964+63=2027, 1965+64=2029
  assert.equal(byId(yearNumbers(2029, ctx)).pension.figure, '1965년생');
  assert.equal(byId(yearNumbers(2034, ctx)).pension.figure, '1969년생'); // 1969년생부터 65세
});

test('올해 알아둘 숫자: 카드마다 출처 ID와 도구 경로가 있고, 국민연금 카드가 있으면 조건 고지문', () => {
  const m = hubModel(copy, null, { year: 2026, ...ctx, channelUrl: 'https://pf.kakao.com/_abc/' });
  assert.equal(m.numbers.label, '2026년에 알아둘 숫자');
  assert.ok(m.numbers.cards.every((c) => /^S-[A-Z]+-\d{2}$/.test(c.source) && /^(health|estate|calendar)\/$/.test(c.path)));
  assert.equal(m.numbers.note, copy.disclaimer.pension);
  assert.equal(hubModel(copy, null, { year: 2028, ...ctx }).numbers.note, null);
});

test('만든 사람: 바이라인·인사말, 채널 주소가 있을 때만 1:1 채팅 링크', () => {
  const m = hubModel(copy, null, { year: 2026, ...ctx, channelUrl: 'https://pf.kakao.com/_abc/' });
  assert.equal(m.operator.name, copy.brand.byline);
  assert.equal(m.operator.text, copy.hub.operatorText);
  assert.equal(m.operator.chat.url, 'https://pf.kakao.com/_abc/chat');
  assert.equal(hubModel(copy, null, { year: 2026, ...ctx, channelUrl: '' }).operator.chat, null);
  assert.equal(hubModel(copy, null).operator, null, '추가 정보 없이 부르면 예전 허브 그대로');
  assert.equal(hubModel(copy, null).numbers, null);
});
const sample = { title: '제목', slug: 'week-01', donguiLine: '한 줄', readMin: 3, publishedAt: '2026-11-12', weekLabel: '11월 2주' };

test('도구 카드 노출 순서: 건강 체크 → 상속·증여 → 내 나이 달력', () => {
  const m = hubModel(copy, null);
  assert.deepEqual(m.tools.map((t) => t.id), ['health', 'estate', 'calendar']);
  assert.deepEqual(m.tools.map((t) => t.n), [1, 2, 3]);
  assert.ok(m.tools.every((t) => !t.path.startsWith('/')), '상대 경로');
});

test('히어로·보조문은 확정 카피 그대로', () => {
  const m = hubModel(copy, null);
  assert.equal(m.hero, copy.hub.hero);
  assert.equal(m.sub, copy.hub.sub);
});

test('주간 글이 없거나 필드가 빠지면 영역 숨김(null)', () => {
  assert.equal(hubModel(copy, null).weekly, null);
  for (const k of ['title', 'slug', 'donguiLine', 'readMin']) {
    const w = { ...sample }; delete w[k];
    assert.equal(normalizeWeekly(w), null, k);
  }
  assert.equal(normalizeWeekly({ ...sample, title: '  ' }), null);
  assert.equal(normalizeWeekly({ ...sample, slug: '../x' }), null);
  assert.equal(normalizeWeekly({ ...sample, readMin: 0 }), null);
});

test('주간 글 카드: 읽는 시간·동의보감 한 줄·경로', () => {
  const w = hubModel(copy, sample).weekly;
  assert.equal(w.readMore, copy.hub.readMore.replace('{min}', '3'));
  assert.equal(w.dongui, `${copy.newsletter.donguiLabel} · 한 줄`);
  assert.equal(w.path, 'diary/week-01/');
  assert.equal(w.dateLabel, '11월 2주');
  assert.equal(hubModel(copy, { ...sample, weekLabel: undefined }).weekly.dateLabel, null);
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
