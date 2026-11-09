// 검토 대기열(SB-11): 상태 전환 규칙, 인증, 서버 흐름(임시 폴더) — 개요 선승인 → 본문 → 승인·예약 → 발행
// 1군 단어는 이 파일에 쓰지 않는다 — 실행 중 사전에서 꺼낸다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, copyFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT, readJSON } from './_load.mjs';
import { apply, allowedActions, defaultPublishAt, WorkflowError } from '../ops/review/workflow.mjs';
import { hashPassword, verifyPassword, isAllowedRemote, createSessions, createLimiter, SESSION_MS } from '../ops/review/auth.mjs';
import { isValidId } from '../ops/review/store.mjs';
import { setFrontMatter } from '../ops/review/checks.mjs';
import { createService } from '../ops/review/service.mjs';
import { createReviewServer } from '../ops/review/server.mjs';

const dict = readJSON('data/forbidden-words.json');
const T1 = dict.tier1_block.words;
const SAMPLE = readFileSync(join(ROOT, 'tests/fixtures/newsletter/sample.md'), 'utf8').replace(/^approvedAt:.*\n/m, '').replace(/^approvedBy:.*\n/m, '');
const OUTLINE = { kind: 'blog', titles: ['50대 건강검진, 이것만은 꼭', '50대 검진 달력', '위·대장 내시경 주기'], toc: ['더해지는 암검진', '출생연도와 검진 해', '결과 읽는 법'], sourceIds: ['S-HLT-01', 'S-HLT-02'], category: 'health', tool: 'health' };

// ── 상태 전환 ─────────────────────────────────────────────

const base = (state, extra = {}) => ({ id: 'C-20261110-abcdef', kind: 'blog', state, outline: OUTLINE, history: [], check: { verdict: state === 'blocked' ? 'block' : state === 'warned' ? 'warn' : 'pass', filterVersion: '1.4', counts: {} }, ...extra });
const NOW = new Date('2026-11-10T10:00:00');

test('차단 항목: 승인 동작이 없고, 요청해도 거절', () => {
  assert.deepEqual(allowedActions(base('blocked')), ['request_revision']);
  assert.throws(() => apply(base('blocked'), 'approve', { by: 'op', publishAt: NOW }, NOW), (e) => e instanceof WorkflowError && /차단/.test(e.message));
});

test('2군 경고: 사유 없으면 승인 불가, 사유는 로그에 남는다', () => {
  assert.throws(() => apply(base('warned'), 'approve', { by: 'op', publishAt: NOW.toISOString() }, NOW), /사유/);
  const { item, log } = apply(base('warned'), 'approve', { by: 'op', reason: '정보 문맥', publishAt: '2026-11-12T09:00' }, NOW);
  assert.equal(item.state, 'approved_scheduled');
  assert.equal(log.reason, '정보 문맥');
});

test('승인 로그 = 콘텐츠 ID · 시각 · 승인자 · 동작 · 필터 결과', () => {
  const { log } = apply(base('draft_pending'), 'approve', { by: '반동수', publishAt: '2026-11-12T09:00' }, NOW);
  assert.deepEqual(Object.keys(log).sort(), ['action', 'approver', 'at', 'contentId', 'filter', 'publishAt']);
  assert.equal(log.approver, '반동수');
  assert.equal(log.filter.verdict, 'pass');
});

test('개요: 3안 중 하나를 골라야 승인, 반려는 재작성 큐', () => {
  assert.throws(() => apply(base('outline_pending'), 'outline_approve', { by: 'op', title: '다른 제목' }, NOW), /제목안/);
  assert.equal(apply(base('outline_pending'), 'outline_approve', { by: 'op', title: OUTLINE.titles[1] }, NOW).item.state, 'draft_requested');
  assert.equal(apply(base('outline_pending'), 'outline_reject', { by: 'op' }, NOW).item.state, 'outline_rework');
});

test('발행: 예약 시각 전에는 불가(자동 발행 없음)', () => {
  const item = base('approved_scheduled', { schedule: { publishAt: '2026-11-12T00:00:00.000Z' } });
  assert.deepEqual(allowedActions(item, new Date('2026-11-11T00:00:00Z')), []);
  assert.throws(() => apply(item, 'publish', { by: 'op' }, new Date('2026-11-11T00:00:00Z')), /발행 시각 전/);
  assert.equal(apply(item, 'publish', { by: 'op' }, new Date('2026-11-12T01:00:00Z')).item.state, 'published');
});

test('기본 발행 시각: 다음 목요일 09:00', () => {
  const d = defaultPublishAt(new Date('2026-11-10T10:00:00')); // 화요일
  assert.equal(d.getDay(), 4);
  assert.equal(d.getHours(), 9);
  assert.equal(d.getDate(), 12);
  assert.equal(defaultPublishAt(new Date('2026-11-12T10:00:00')).getDate(), 19, '목요일 09시 이후면 다음 주');
});

// ── 인증 ─────────────────────────────────────────────────

test('비밀번호 해시·검증, 접속 주소 제한, 세션 12시간, 로그인 실패 제한', () => {
  const h = hashPassword('correct horse battery');
  assert.ok(verifyPassword('correct horse battery', h));
  assert.ok(!verifyPassword('wrong', h));
  assert.ok(!verifyPassword('x', 'plain'));
  for (const ok of ['127.0.0.1', '::1', '::ffff:127.0.0.1', '100.64.0.1', '100.101.102.103', '100.127.255.254', 'fd7a:115c:a1e0::1']) assert.ok(isAllowedRemote(ok), ok);
  for (const no of ['192.168.0.10', '10.0.0.1', '100.63.0.1', '100.128.0.1', '8.8.8.8', '', undefined]) assert.ok(!isAllowedRemote(no), String(no));
  let t = 0;
  const s = createSessions({ now: () => t });
  const a = s.create('op');
  t = SESSION_MS - 1; assert.ok(s.get(a.id));
  t = SESSION_MS; assert.equal(s.get(a.id), null);
  const l = createLimiter({ max: 2, now: () => 0 });
  l.fail('ip'); assert.ok(!l.blocked('ip')); l.fail('ip'); assert.ok(l.blocked('ip'));
});

test('항목 ID 형식(경로 이탈 방지)', () => {
  assert.ok(isValidId('C-20261110-abcdef'));
  for (const bad of ['../x', 'C-20261110-abcdef/../../', 'C-1-a', '']) assert.ok(!isValidId(bad), bad);
});

test('front matter 값 넣기', () => {
  const md = setFrontMatter(SAMPLE, { approvedAt: '2026-11-10', approvedBy: '반동수', publishedAt: '2026-11-19' });
  assert.match(md, /^approvedAt: 2026-11-10$/m);
  assert.match(md, /^publishedAt: 2026-11-19$/m);
  assert.equal((md.match(/^publishedAt:/gm) || []).length, 1);
});

// ── 서버 흐름 ─────────────────────────────────────────────

async function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'fd-review-'));
  const opsRoot = join(dir, 'ops');
  const siteRoot = join(dir, 'site');
  mkdirSync(siteRoot, { recursive: true });
  copyFileSync(join(ROOT, 'index.html'), join(siteRoot, 'index.html'));
  const service = createService({ opsRoot, siteRoot, siteUrl: 'https://example.org/fd/' });
  const clock = { t: new Date('2026-11-10T10:00:00') };
  const server = createReviewServer({ service, auth: { user: 'operator', passwordHash: hashPassword('a long test password') }, now: () => clock.t });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  const req = async (path, { method = 'GET', form = null } = {}) => {
    const res = await fetch(url + path, { method, redirect: 'manual', headers: { cookie, ...(form ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) }, body: form ? new URLSearchParams(form).toString() : undefined });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    return { status: res.status, location: res.headers.get('location'), text: await res.text(), headers: res.headers };
  };
  const csrfOf = (html) => /name="csrf" value="([0-9a-f]+)"/.exec(html)?.[1];
  const close = () => new Promise((r) => { server.close(() => { rmSync(dir, { recursive: true }); r(); }); server.closeAllConnections(); });
  return { service, clock, req, csrfOf, close, opsRoot, siteRoot };
}

test('서버: 로그인 없이는 대기열·동작 불가, 틀린 비밀번호 401', async () => {
  const s = await setup();
  assert.equal((await s.req('/')).status, 303);
  assert.equal((await s.req('/item/C-20261110-abcdef/approve', { method: 'POST', form: { csrf: 'x' } })).status, 401);
  assert.equal((await s.req('/login', { method: 'POST', form: { user: 'operator', password: 'nope' } })).status, 401);
  const ok = await s.req('/login', { method: 'POST', form: { user: 'operator', password: 'a long test password' } });
  assert.equal(ok.status, 303);
  assert.match(ok.headers.get('set-cookie'), /HttpOnly; SameSite=Strict; Path=\/; Max-Age=43200/);
  const page = await s.req('/');
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  // 세션 12시간 뒤 만료
  s.clock.t = new Date(s.clock.t.getTime() + SESSION_MS + 1);
  assert.equal((await s.req('/')).status, 303);
  await s.close();
});

test('서버 흐름: 개요 선승인 → 본문 → 승인·예약 → (시각 전 거절) → 발행·빌드 → 로그', async () => {
  const s = await setup();
  await s.req('/login', { method: 'POST', form: { user: 'operator', password: 'a long test password' } });
  const item = s.service.submitOutline(OUTLINE);
  assert.equal(item.state, 'outline_pending');

  let page = await s.req('/');
  const csrf = s.csrfOf(page.text);
  assert.match(page.text, /개요 승인 → 본문 생성/);
  // CSRF 없으면 거절
  assert.equal((await s.req(`/item/${item.id}/outline_approve`, { method: 'POST', form: { title: OUTLINE.titles[0] } })).status, 403);
  assert.equal((await s.req(`/item/${item.id}/outline_approve`, { method: 'POST', form: { csrf, title: OUTLINE.titles[0] } })).status, 303);
  assert.equal(s.service.store.get(item.id).state, 'draft_requested');

  // 에이전트 본문 제출 → 검사 통과
  assert.equal(s.service.submitDraft(item.id, SAMPLE).state, 'draft_pending');
  page = await s.req(`/?id=${item.id}`);
  assert.match(page.text, /승인 · 예약/);
  assert.match(page.text, /금지어·근거 통과/);
  assert.equal((await s.req(`/preview/${item.id}`)).status, 200);

  // 승인·예약: 11/12 09:00
  assert.equal((await s.req(`/item/${item.id}/approve`, { method: 'POST', form: { csrf, publishAt: '2026-11-12T09:00' } })).status, 303);
  const approved = s.service.store.get(item.id);
  assert.equal(approved.state, 'approved_scheduled');
  assert.ok(existsSync(join(s.opsRoot, 'approved', item.id, 'draft.md')), 'approved 폴더로 이동');
  assert.match(s.service.store.readDraft(item.id), /^approvedBy: operator$/m);

  // 시각 전 발행 → 거절, 빌드 안 함
  page = await s.req(`/?id=${item.id}`);
  assert.doesNotMatch(page.text, />발행<\/button>/);
  assert.equal((await s.req(`/item/${item.id}/publish`, { method: 'POST', form: { csrf } })).status, 409);
  assert.ok(!existsSync(join(s.siteRoot, 'diary')));

  // 메시지 복사 문안(SB-10)
  assert.match(page.text, /\[11월 2주 다이어리\]/);
  assert.match(page.text, /글 읽기: https:\/\/example.org\/fd\/diary\/fixture-sample\//);
  assert.match(page.text, /내 나이 건강 체크 도구: https:\/\/example.org\/fd\/health\//);

  // 시각 이후 발행 → 빌드
  s.clock.t = new Date('2026-11-12T09:05:00');
  // 이틀이 지나 세션(12시간)이 만료됐으므로 다시 로그인
  assert.equal((await s.req(`/item/${item.id}/publish`, { method: 'POST', form: { csrf } })).status, 401);
  await s.req('/login', { method: 'POST', form: { user: 'operator', password: 'a long test password' } });
  page = await s.req(`/?id=${item.id}`);
  assert.match(page.text, />발행<\/button>/, '시각 이후 발행 버튼이 열린다');
  const csrf2 = s.csrfOf(page.text);
  assert.equal((await s.req(`/item/${item.id}/publish`, { method: 'POST', form: { csrf: csrf2 } })).status, 303);
  assert.equal(s.service.store.get(item.id).state, 'published');
  assert.ok(existsSync(join(s.siteRoot, 'diary/fixture-sample/index.html')));
  assert.equal(JSON.parse(readFileSync(join(s.siteRoot, 'content/weekly.json'), 'utf8')).slug, 'fixture-sample');
  assert.ok(existsSync(join(s.opsRoot, 'published', item.id)));

  const logs = s.service.store.logs().map((l) => l.action);
  assert.deepEqual(logs.reverse(), ['outline_approve', 'draft_submit', 'approve', 'publish']);
  page = await s.req('/?tab=logs');
  assert.match(page.text, /operator/);
  await s.close();
});

test('서버: 차단 원고는 승인 버튼이 렌더되지 않고, 직접 보낸 승인도 거절', async () => {
  const s = await setup();
  await s.req('/login', { method: 'POST', form: { user: 'operator', password: 'a long test password' } });
  const item = s.service.submitOutline(OUTLINE);
  let page = await s.req('/');
  const csrf = s.csrfOf(page.text);
  await s.req(`/item/${item.id}/outline_approve`, { method: 'POST', form: { csrf, title: OUTLINE.titles[0] } });
  const bad = SAMPLE.replace('구조입니다.', `구조입니다. ${T1[6]} 안내입니다.`);
  assert.equal(s.service.submitDraft(item.id, bad).state, 'blocked');

  page = await s.req(`/?id=${item.id}`);
  assert.doesNotMatch(page.text, /action="\/item\/[^"]+\/approve"/, '승인 폼 없음');
  assert.doesNotMatch(page.text, /승인 · 예약/);
  assert.match(page.text, /수정 요청/);
  const m = await s.req('/m');
  assert.doesNotMatch(m.text, /\/approve"/);
  assert.match(m.text, /반려/);

  const forced = await s.req(`/item/${item.id}/approve`, { method: 'POST', form: { csrf, publishAt: '2026-11-12T09:00' } });
  assert.equal(forced.status, 409);
  assert.equal(s.service.store.get(item.id).state, 'blocked');

  // 수정 요청 → 재작성 큐 → 고친 본문 제출 → 통과
  await s.req(`/item/${item.id}/request_revision`, { method: 'POST', form: { csrf, note: '1군 단어 제거' } });
  assert.equal(s.service.store.get(item.id).state, 'draft_requested');
  assert.equal(s.service.submitDraft(item.id, SAMPLE).state, 'draft_pending');
  await s.close();
});

test('서버: 2군 경고 — 사유 없이 승인 400, 모바일 뷰는 승인·반려·개요 수정만', async () => {
  const s = await setup();
  await s.req('/login', { method: 'POST', form: { user: 'operator', password: 'a long test password' } });
  const o = s.service.submitOutline(OUTLINE);
  const csrf = s.csrfOf((await s.req('/')).text);
  const m0 = await s.req('/m');
  assert.match(m0.text, />승인</);
  assert.match(m0.text, />반려</);
  assert.match(m0.text, />개요 수정</);
  assert.doesNotMatch(m0.text, />발행</);
  await s.req(`/item/${o.id}/outline_approve`, { method: 'POST', form: { csrf, title: OUTLINE.titles[0], back: '/m' } });
  const warnMd = SAMPLE.replace('구조입니다.', '구조입니다. 자세한 내용은 상담으로 확인합니다.');
  assert.equal(s.service.submitDraft(o.id, warnMd).state, 'warned');
  assert.equal((await s.req(`/item/${o.id}/approve`, { method: 'POST', form: { csrf, publishAt: '2026-11-12T09:00' } })).status, 400);
  assert.equal((await s.req(`/item/${o.id}/approve`, { method: 'POST', form: { csrf, publishAt: '2026-11-12T09:00', reason: '정보 문맥' } })).status, 303);
  assert.equal(s.service.store.logs()[0].reason, '정보 문맥');
  // back 파라미터는 내부 경로만
  const r = await s.req(`/item/${o.id}/request_revision`, { method: 'POST', form: { csrf, back: 'https://evil.example/' } });
  assert.ok(!r.location || r.location.startsWith('/'));
  await s.close();
});

test('개요 검사: 제목 3안 · 목차 · 라이브러리에 있는 출처 ID', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fd-outline-'));
  const svc = createService({ opsRoot: join(dir, 'ops'), siteRoot: dir });
  assert.throws(() => svc.submitOutline({ ...OUTLINE, titles: ['하나'] }), /제목은 3안/);
  assert.throws(() => svc.submitOutline({ ...OUTLINE, sourceIds: ['S-ZZZ-99'] }), /S-ZZZ-99/);
  assert.throws(() => svc.submitOutline({ ...OUTLINE, toc: [] }), /목차/);
  assert.throws(() => svc.submitOutline({ ...OUTLINE, titles: [`${T1[0]} 이야기`, 'b', 'c'] }), /1군/);
  rmSync(dir, { recursive: true });
});

test('ops/review 코드에 크론·타이머·웹훅·외부 호출이 없다', () => {
  const dir = join(ROOT, 'ops/review');
  const files = readdirSync(dir).filter((f) => f.endsWith('.mjs')).map((f) => join(dir, f));
  for (const f of files) {
    const src = readFileSync(f, 'utf8').replace(/^\s*\/\/.*$/gm, '');
    for (const bad of [/setInterval/, /setTimeout/, /cron/i, /\bfetch\s*\(/, /child_process/, /webhook/i]) assert.ok(!bad.test(src), `${f}: ${bad}`);
  }
});
