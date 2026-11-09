// 뉴스레터 글(SB-09): 슬롯 검사(빠지면 빌드 실패), 렌더 결과, build() 산출물
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, existsSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT, readJSON } from './_load.mjs';
import { validateArticle, renderArticle, pickWeekly, weekLabel } from '../scripts/lib/newsletter.mjs';
import { build } from '../scripts/build.mjs';
import { tier1Hits } from './forbidden-guard.test.mjs';

const rules = readJSON('data/newsletterRules.json');
const copy = readJSON('data/copy.ko.json');
const SAMPLE = readFileSync(join(ROOT, 'tests/fixtures/newsletter/sample.md'), 'utf8');
const v = (md) => validateArticle(md, { rules, copy });
const errs = (md) => v(md).errors.join('\n');

test('예시 원고는 모든 슬롯을 통과한다', () => {
  const r = v(SAMPLE);
  assert.deepEqual(r.errors, []);
  assert.ok(r.article.chars >= rules.body.minChars && r.article.chars <= rules.body.maxChars);
  assert.equal(r.article.weekLabel, '11월 2주');
  assert.equal(r.article.donguiLine, '“밤에는 일찍 자고 아침에는 늦게 일어나라” — 내경편 권1');
  assert.equal(r.article.approved, true);
});

const cut = (md, from, to) => md.slice(0, md.indexOf(from)) + md.slice(md.indexOf(to) + to.length);
const SOURCES = SAMPLE.slice(SAMPLE.indexOf('::: sources'), SAMPLE.lastIndexOf(':::') + 3);

test('출처가 없으면 실패 (SB-09 ④)', () => {
  assert.match(errs(SAMPLE.replace(SOURCES, '')), /출처 없음/);
  assert.match(errs(SAMPLE.replace(SOURCES, '::: sources\n:::')), /출처 없음/);
  assert.match(errs(SAMPLE.replace(SOURCES, '::: sources\n- 그냥 출처 이름\n:::')), /출처 형식/);
});

test('본문 출처 표시가 출처 목록에 없으면 실패', () => {
  assert.match(errs(SAMPLE.replace('[S-HLT-01]. 50대', '[S-TAX-09]. 50대')), /S-TAX-09/);
});

test('핵심 요약: 없거나 2–3줄이 아니면 실패', () => {
  assert.match(errs(cut(SAMPLE, '::: summary', ':::\n\n## 50대')), /핵심 요약/);
  assert.match(errs(SAMPLE.replace('- 50세부터 대장암검진이 더해지며 1년마다 분변잠혈검사입니다 [S-HLT-02]\n', '')), /핵심 요약 1줄/);
  assert.match(errs(SAMPLE.replace('::: summary\n', '::: summary\n- 하나\n- 둘\n')), /핵심 요약 4줄/);
});

test('동의보감 한 줄: 인용·출처·오늘의 관점·실천이 모두 있어야 한다', () => {
  for (const k of ['quote', 'source', 'view', 'practice']) {
    const line = SAMPLE.split('\n').find((l) => l.startsWith(`${k}:`));
    assert.match(errs(SAMPLE.replace(`${line}\n`, '')), new RegExp(`동의보감 '${k}'`), k);
  }
});

test('소제목 2–3개, 본문 800–1,200자', () => {
  assert.match(errs(SAMPLE.replace('## 검진 결과를 읽는 방법', '').replace('## 출생연도로 정해지는 검진 해', '')), /소제목 1개/);
  assert.match(errs(SAMPLE.replace('## 검진 결과를 읽는 방법\n\n', '## 검진 결과를 읽는 방법\n\n## 넷째\n\n')), /소제목 4개/);
  const short = SAMPLE.replace(/## 검진 결과를 읽는 방법\n\n[^\n]+\n/, '');
  assert.match(errs(short), /본문 \d+자/);
  const long = SAMPLE.replace('::: dongui', `${'가나다라마바사아자차카타파하 '.repeat(40)}\n\n::: dongui`);
  assert.match(errs(long), /본문 \d+자/);
  assert.match(errs(SAMPLE.replace('## 50대에', '### 50대에')), /'## ' 만/);
});

test('front matter: 분류 4종·도구 1개·고지문 종류·slug 형식', () => {
  assert.match(errs(SAMPLE.replace('category: health', 'category: ad')), /category/);
  assert.match(errs(SAMPLE.replace('tool: health', 'tool: health, estate')), /도구 링크 카드는 1개/);
  assert.match(errs(SAMPLE.replace('disclaimer: general', 'disclaimer: none')), /disclaimer/);
  assert.match(errs(SAMPLE.replace('slug: fixture-sample', 'slug: ../x')), /slug/);
  assert.match(errs(SAMPLE.replace('title: ', 'titel: ')), /'title' 없음/);
  assert.match(errs(SAMPLE.replace('국가건강검진은 2년마다', '<script>x</script>국가건강검진은 2년마다')), /HTML/);
  assert.equal(v(SAMPLE.replace('approvedBy: 테스트\n', '')).article.approved, false);
});

test('주차 표기: 올림(일 ÷ 7)', () => {
  assert.equal(weekLabel('2026-11-01', rules), '11월 1주');
  assert.equal(weekLabel('2026-11-07', rules), '11월 1주');
  assert.equal(weekLabel('2026-11-08', rules), '11월 2주');
  assert.equal(weekLabel('2026-12-31', rules), '12월 5주');
});

test('렌더: 슬롯 순서 고정, 바이라인, 스크립트·광고 없음, 이스케이프', () => {
  const a = v(SAMPLE.replace('title: 50대', 'title: <b>50대')).article;
  const full = renderArticle(a, { copy });
  const html = full.slice(full.indexOf('<body'));
  const order = ['class="nl-kicker"', 'class="nl-title"', copy.brand.byline, 'class="nl-summary', 'class="nl-h2"', 'class="nl-tool"', 'class="card nl-dongui"', 'class="nl-sources"', 'class="disclaimer"'].map((k) => html.indexOf(k));
  assert.ok(order.every((x) => x > 0), String(order));
  assert.deepEqual(order, [...order].sort((x, y) => x - y), '슬롯 순서');
  assert.ok(html.indexOf('class="nl-summary') > html.indexOf('<p>'), '요약은 첫 문단 뒤');
  assert.equal((html.match(/class="nl-tool"/g) || []).length, 1, '도구 카드 1개');
  assert.ok(html.includes(`${copy.newsletter.toolCardPrefix}내 나이 건강 체크`));
  assert.ok(html.includes(copy.disclaimer.general));
  assert.ok(html.includes('건강 · 11월 2주'));
  assert.ok(!/<script/i.test(full), '스크립트 없음');
  assert.ok(html.includes('&lt;b&gt;50대') && !html.includes('<b>50대'), '제목 이스케이프');
  assert.ok(html.includes('href="#src-S-HLT-01"') && html.includes('id="src-S-HLT-01"'), '출처 번호 연결');
  assert.ok(!html.includes('[S-HLT-01]'), '출처 ID 원문 노출 안 함');
  assert.deepEqual(tier1Hits(html), []);
});

test('weekly: 승인·발행일 지난 글 중 가장 최근 1건', () => {
  const a = v(SAMPLE).article;
  const b = v(SAMPLE.replace('slug: fixture-sample', 'slug: newer').replace('publishedAt: 2026-11-12', 'publishedAt: 2026-11-19')).article;
  const c = v(SAMPLE.replace('slug: fixture-sample', 'slug: draft').replace('publishedAt: 2026-11-12', 'publishedAt: 2026-11-15').replace('approvedBy: 테스트\n', '')).article;
  assert.equal(pickWeekly([a, b, c], '2026-11-16').slug, 'fixture-sample');
  assert.equal(pickWeekly([a, b, c], '2026-11-20').slug, 'newer');
  assert.equal(pickWeekly([c], '2026-11-20'), null);
  const w = pickWeekly([a], '2026-11-12');
  assert.deepEqual(Object.keys(w).sort(), ['donguiLine', 'publishedAt', 'readMin', 'slug', 'summary', 'title', 'weekLabel']);
});

// ── build() — 임시 폴더에서 실행 ─────────────────────────────

function sandbox(files) {
  const dir = mkdtempSync(join(tmpdir(), 'fd-build-'));
  mkdirSync(join(dir, 'content'));
  copyFileSync(join(ROOT, 'index.html'), join(dir, 'index.html'));
  for (const [name, md] of Object.entries(files)) writeFileSync(join(dir, 'content', name), md);
  return dir;
}
const pass = () => ({ verdict: 'pass', findings: [] });

test('build: 금지어 검사기가 없으면 실패하고 아무것도 쓰지 않는다', () => {
  const dir = sandbox({ 'a.md': SAMPLE });
  const r = build({ root: dir, contentDir: join(dir, 'content'), today: '2026-11-12', filter: null });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(), /검사기/);
  assert.ok(!existsSync(join(dir, 'diary')));
  rmSync(dir, { recursive: true });
});

test('build: 통과하면 diary/{slug}/index.html · content/weekly.json · 허브 주간 글 자리를 만든다', () => {
  const dir = sandbox({ 'a.md': SAMPLE });
  const r = build({ root: dir, contentDir: join(dir, 'content'), today: '2026-11-12', filter: pass });
  assert.equal(r.ok, true, r.errors.join());
  assert.ok(existsSync(join(dir, 'diary/fixture-sample/index.html')));
  const weekly = JSON.parse(readFileSync(join(dir, 'content/weekly.json'), 'utf8'));
  assert.equal(weekly.slug, 'fixture-sample');
  assert.match(readFileSync(join(dir, 'index.html'), 'utf8'), /id="weekly-data">\{"title"/);
  assert.match(readFileSync(join(dir, 'diary/fixture-sample/index.html'), 'utf8'), /사업자 정보/);
  rmSync(dir, { recursive: true });
});

test('build: 슬롯 위반·검사 block·slug 중복이면 실패, 승인 전·발행일 전은 건너뜀', () => {
  let dir = sandbox({ 'a.md': SAMPLE.replace(SOURCES, '') });
  assert.equal(build({ root: dir, contentDir: join(dir, 'content'), today: '2026-11-12', filter: pass }).ok, false);
  rmSync(dir, { recursive: true });

  dir = sandbox({ 'a.md': SAMPLE });
  const r = build({ root: dir, contentDir: join(dir, 'content'), today: '2026-11-12', filter: () => ({ verdict: 'block', findings: [{}] }) });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(), /block/);
  rmSync(dir, { recursive: true });

  dir = sandbox({ 'a.md': SAMPLE, 'b.md': SAMPLE });
  assert.match(build({ root: dir, contentDir: join(dir, 'content'), today: '2026-11-12', filter: pass }).errors.join(), /slug 중복/);
  rmSync(dir, { recursive: true });

  dir = sandbox({ 'a.md': SAMPLE.replace('approvedBy: 테스트\n', ''), 'b.md': SAMPLE.replace('slug: fixture-sample', 'slug: later').replace('publishedAt: 2026-11-12', 'publishedAt: 2026-12-03') });
  const s = build({ root: dir, contentDir: join(dir, 'content'), today: '2026-11-12', filter: pass });
  assert.equal(s.ok, true);
  assert.deepEqual(s.pages.map((p) => p.path), ['404.html'], '글 페이지 없음(404 만)');
  assert.equal(s.weekly, null);
  assert.match(s.log.join('\n'), /승인 전/);
  assert.match(s.log.join('\n'), /발행일/);
  assert.match(readFileSync(join(dir, 'index.html'), 'utf8'), /id="weekly-data"><\/script>/);
  rmSync(dir, { recursive: true });
});

test('build 스크립트는 크론·스케줄러·자동 발행 경로가 없다', () => {
  const src = readFileSync(join(ROOT, 'scripts/build.mjs'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  for (const bad of [/setInterval/, /setTimeout/, /node-cron|cron\(/i, /\bfetch\s*\(/, /child_process/, /git\s+push/]) assert.ok(!bad.test(src), String(bad));
});
