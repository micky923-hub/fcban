// SB-13 상태·예외: 서비스워커 사전 캐시, 404, 내려간 글
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative } from 'node:path';
import { ROOT, readJSON } from './_load.mjs';
import { build, siteBasePath } from '../scripts/build.mjs';

const copy = readJSON('data/copy.ko.json');
const SW = readFileSync(join(ROOT, 'sw.js'), 'utf8');
const PRECACHE = JSON.parse(`[${/const PRECACHE = \[([\s\S]*?)\];/.exec(SW)[1].replace(/'/g, '"').replace(/,\s*$/, '')}]`);
const onDisk = (p) => join(ROOT, p === './' ? 'index.html' : p.endsWith('/') ? `${p}index.html` : p);

test('사전 캐시 목록의 파일이 모두 있다', () => {
  for (const p of PRECACHE) assert.ok(existsSync(onDisk(p)), p);
});

/** 고객 화면이 불러오는 모듈(import · script src)을 따라가 모은다 */
function deps(entry, seen = new Set()) {
  const abs = join(ROOT, entry);
  if (seen.has(abs) || !existsSync(abs)) return seen;
  seen.add(abs);
  const src = readFileSync(abs, 'utf8');
  const refs = [
    ...[...src.matchAll(/import\s+(?:[^'"]+\s+from\s+)?['"](\.[^'"]+)['"]/g)].map((m) => m[1]),
    ...[...src.matchAll(/import\(\s*['"](\.[^'"]+)['"]\s*\)/g)].map((m) => m[1]),
    ...[...src.matchAll(/<(?:script[^>]+src|link[^>]+href)="(\.{1,2}\/[^"]+)"/g)].map((m) => m[1]),
  ];
  for (const r of refs) deps(relative(ROOT, join(dirname(abs), r)), seen);
  return seen;
}

test('허브·도구 3개가 불러오는 파일이 모두 사전 캐시에 있다(완전 오프라인)', () => {
  const cached = new Set(PRECACHE.map((p) => onDisk(p)));
  for (const page of ['index.html', 'calendar/index.html', 'health/index.html', 'estate/index.html']) {
    for (const f of deps(page)) assert.ok(cached.has(f), `${page} → ${relative(ROOT, f)}`);
  }
});

test('서비스워커: 같은 출처 GET 만, 쿼리 요청·다른 출처는 캐시하지 않음, 저장소 API 없음', () => {
  assert.match(SW, /if \(req\.method !== 'GET'\) return;/);
  assert.match(SW, /url\.origin !== self\.location\.origin\) return;/);
  assert.match(SW, /if \(url\.search\) return;/);
  assert.match(SW, /caches\.match\(scopeURL\('404\.html'\)\)/, '오프라인 미캐시 화면은 404');
  for (const bad of [/localStorage/, /indexedDB/, /document\.cookie/, /postMessage/, /sync\b.*register/]) assert.ok(!bad.test(SW), String(bad));
});

test('모든 고객 화면은 공통 골격(mountPage)으로 오프라인 안내 줄과 서비스워커를 쓴다', () => {
  const ui = readFileSync(join(ROOT, 'assets/ui.js'), 'utf8');
  assert.match(ui, /main\.append\(offlineBanner\(\)\)/);
  assert.match(ui, /registerServiceWorker\(\);/);
  assert.match(ui, /copy\.states\.offline/);
  for (const f of ['index.js', 'calendar/calendar.js', 'health/health.js', 'estate/estate.js']) {
    assert.match(readFileSync(join(ROOT, f), 'utf8'), /mountPage\(/, f);
  }
});

test('404.html: 확정 카피, 허브 버튼 1개, 검색창·스크립트 없음', () => {
  const html = readFileSync(join(ROOT, '404.html'), 'utf8');
  assert.ok(html.includes(copy.states.notFoundTitle));
  assert.ok(html.includes(copy.states.notFoundSub));
  assert.equal((html.match(/class="btn /g) || []).length, 1);
  assert.ok(html.includes(`>${copy.states.notFoundCta}</a>`));
  assert.ok(!/<script/i.test(html));
  assert.ok(!/type="search"|<input/i.test(html));
  assert.match(html, /href="\/assets\/base\.css"/, '어느 경로에서 열려도 같은 자산');
});

test('배포 기준 경로', () => {
  assert.equal(siteBasePath(''), '/');
  assert.equal(siteBasePath('https://user.github.io/financial-diary'), '/financial-diary/');
  assert.equal(siteBasePath('https://diary.example.kr/'), '/');
  assert.equal(siteBasePath('not a url'), '/');
});

test('내려간 글: 같은 주소에 안내 + 허브 버튼, 허브 주간 글에서 빠진다', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fd-unpub-'));
  mkdirSync(join(dir, 'content'));
  copyFileSync(join(ROOT, 'index.html'), join(dir, 'index.html'));
  writeFileSync(join(dir, 'content', 'gone.md'), '---\ntitle: 지난 글\nslug: gone-post\nunpublished: true\n---\n\n본문\n');
  const r = build({ root: dir, contentDir: join(dir, 'content'), today: '2026-11-12', filter: () => ({ verdict: 'pass', findings: [] }) });
  assert.equal(r.ok, true, r.errors.join());
  const html = readFileSync(join(dir, 'diary/gone-post/index.html'), 'utf8');
  assert.ok(html.includes(copy.states.unpublished));
  assert.ok(!html.includes('본문'));
  assert.match(html, /href="\.\.\/\.\.\/"/);
  assert.equal(r.weekly, null);
  rmSync(dir, { recursive: true });
});

test('입력 오류 문구는 필드 아래 한 줄(aria-live) — 모달·알림창을 쓰지 않는다', () => {
  for (const f of ['calendar/calendar.js', 'estate/estate.js', 'health/health.js', 'assets/ui.js']) {
    const src = readFileSync(join(ROOT, f), 'utf8');
    assert.ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(src), f);
  }
  const est = readFileSync(join(ROOT, 'estate/estate.js'), 'utf8');
  assert.match(est, /submit\.disabled = !requiredFilled\(\)/, '값이 틀려도 버튼은 활성(필수값 미입력만 비활성)');
});

test('사이트 주소: config.SITE_URL 과 CNAME 이 같은 호스트, 쿼리·해시 없음', async () => {
  const { default: config } = await import('../assets/config.js');
  const u = new URL(config.SITE_URL);
  assert.equal(u.protocol, 'https:');
  assert.equal(u.search + u.hash, '');
  assert.ok(u.pathname.endsWith('/'));
  assert.equal(readFileSync(join(ROOT, 'CNAME'), 'utf8').trim(), u.host);
  assert.equal(siteBasePath(config.SITE_URL), u.pathname);
});
