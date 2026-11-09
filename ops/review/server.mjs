// 운영자 검토 대기열 서버 (SB-11) — node:http, 의존성 없음.
//   OPS_USER=… OPS_PASSWORD_HASH='scrypt$…' node ops/review/server.mjs
//   (해시는 node ops/review/hash-password.mjs '<비밀번호>')
// 환경변수: OPS_HOST(기본 127.0.0.1 — Tailscale IP 로 바꿔 내부망에만 노출), OPS_PORT(8791),
//           OPS_COOKIE_SECURE=1(https 로 열 때), OPS_ROOT(기본 ops/), SITE_ROOT(기본 저장소 루트)
// 보안: 루프백·Tailscale 대역 외 접속 403 · 로그인 1계정 · 세션 12시간 · CSRF · 로그인 실패 제한
// 발행은 로그인한 운영자의 '발행' 클릭에서만 실행된다. 타이머·스케줄러·웹훅 없음.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createService } from './service.mjs';
import { tabItems, WorkflowError } from './workflow.mjs';
import { verifyPassword, safeEqual, isAllowedRemote, parseCookies, createSessions, createLimiter, SESSION_MS } from './auth.mjs';
import { queuePage, mobilePage, loginPage, sourcesPage, dictionaryPage, logsPage, layout, esc } from './views.mjs';
import { renderArticle, validateArticle } from '../../scripts/lib/newsletter.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const COOKIE = 'fd_ops';
const STATIC = {
  '/static/review.js': ['ops/review/static/review.js', 'text/javascript; charset=utf-8'],
  '/static/review.css': ['ops/review/static/review.css', 'text/css; charset=utf-8'],
  '/site/assets/base.css': ['assets/base.css', 'text/css; charset=utf-8'],
};
const ACTIONS = new Set(['outline_save', 'outline_approve', 'outline_reject', 'approve', 'request_revision', 'publish']);
const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);

/**
 * @param {object} o
 * @param {ReturnType<createService>} o.service
 * @param {{user:string, passwordHash:string}} o.auth
 * @param {() => Date} [o.now]
 * @param {boolean} [o.cookieSecure]
 */
export function createReviewServer({ service, auth, now = () => new Date(), cookieSecure = false }) {
  if (!auth?.user || !auth?.passwordHash) throw new Error('OPS_USER / OPS_PASSWORD_HASH 가 필요합니다');
  const sessions = createSessions({ now: () => now().getTime() });
  const limiter = createLimiter({ now: () => now().getTime() });
  const dict = readJSON('data/forbidden-words.json');
  const copy = readJSON('data/copy.ko.json');

  const send = (res, status, body, type = 'text/html; charset=utf-8', extra = {}) => {
    res.writeHead(status, {
      'content-type': type,
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      'x-robots-tag': 'noindex, nofollow',
      'content-security-policy': "default-src 'self'; img-src 'self' data:; frame-ancestors 'none'; form-action 'self'; base-uri 'none'; object-src 'none'",
      ...extra,
    });
    res.end(body);
  };
  const redirect = (res, to, extra = {}) => send(res, 303, '', 'text/plain', { location: to, ...extra });
  const safeBack = (b, fallback) => (typeof b === 'string' && /^\/(?:m|\?[\w=&%.-]*)?$/.test(b) ? b : fallback);
  const withMsg = (to, msg) => `${to}${to.includes('?') ? '&' : '?'}msg=${encodeURIComponent(msg)}`;

  async function readBody(req) {
    let size = 0;
    const chunks = [];
    for await (const c of req) {
      size += c.length;
      if (size > 64 * 1024) throw new WorkflowError('요청이 너무 큽니다.', 413);
      chunks.push(c);
    }
    return Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString('utf8')));
  }

  return createServer(async (req, res) => {
    try {
      const ip = req.socket.remoteAddress;
      if (!isAllowedRemote(ip)) return send(res, 403, '내부망 전용입니다.', 'text/plain; charset=utf-8');
      const url = new URL(req.url, 'http://ops.local');
      const path = url.pathname;

      if (req.method === 'GET' && STATIC[path]) return send(res, 200, readFileSync(join(ROOT, STATIC[path][0])), STATIC[path][1]);

      // ── 로그인 ──
      if (path === '/login' && req.method === 'GET') return send(res, 200, loginPage(null));
      if (path === '/login' && req.method === 'POST') {
        if (limiter.blocked(ip)) return send(res, 429, loginPage('로그인 시도가 많습니다. 15분 뒤 다시 시도합니다.'));
        const body = await readBody(req);
        const ok = safeEqual(body.user || '', auth.user) && verifyPassword(body.password || '', auth.passwordHash);
        if (!ok) { limiter.fail(ip); return send(res, 401, loginPage('아이디 또는 비밀번호가 맞지 않습니다.')); }
        limiter.reset(ip);
        const s = sessions.create(auth.user);
        const cookie = `${COOKIE}=${s.id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}${cookieSecure ? '; Secure' : ''}`;
        return redirect(res, '/', { 'set-cookie': cookie });
      }

      const session = sessions.get(parseCookies(req.headers.cookie)[COOKIE]);
      if (!session) return req.method === 'GET' ? redirect(res, '/login') : send(res, 401, '로그인이 필요합니다.', 'text/plain; charset=utf-8');

      // ── 동작(POST): CSRF 필수 ──
      if (req.method === 'POST') {
        const body = await readBody(req);
        if (!body.csrf || !safeEqual(body.csrf, session.csrf)) return send(res, 403, '요청을 확인할 수 없습니다(CSRF).', 'text/plain; charset=utf-8');
        if (path === '/logout') {
          sessions.destroy(session.id);
          return redirect(res, '/login', { 'set-cookie': `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0` });
        }
        const m = /^\/item\/([\w-]+)\/(\w+)$/.exec(path);
        if (!m || !ACTIONS.has(m[2])) return send(res, 404, '없는 동작입니다.', 'text/plain; charset=utf-8');
        const [, id, action] = m;
        const back = safeBack(body.back, `/?id=${encodeURIComponent(id)}`);
        const payload = {
          by: session.user,
          title: body.title,
          note: body.note,
          reason: body.reason,
          publishAt: body.publishAt,
          outline: action === 'outline_save' ? { titles: lines(body.titles), toc: lines(body.toc), sourceIds: lines(body.sourceIds) } : undefined,
        };
        try {
          await service.act(id, action, payload, now());
          return redirect(res, withMsg(back, '처리했습니다.'));
        } catch (e) {
          if (!(e instanceof WorkflowError)) throw e;
          return send(res, e.status, layout({ title: '처리할 수 없음', csrf: session.csrf, body: `<section class="panel"><h1>처리할 수 없습니다</h1><p class="flash flash--err" role="alert">${esc(e.message)}</p><a class="text-link" href="${esc(back)}">돌아가기 →</a></section>` }));
        }
      }

      if (req.method !== 'GET') return send(res, 405, '', 'text/plain');
      const items = service.store.list();
      const queueCount = tabItems(items, 'queue').length;
      const msg = url.searchParams.get('msg');

      if (path === '/m') return send(res, 200, mobilePage({ items: tabItems(items, 'queue'), csrf: session.csrf, now: now(), msg }));

      const pv = /^\/preview\/([\w-]+)$/.exec(path);
      if (pv) {
        const item = service.store.get(pv[1]);
        const md = item && service.store.readDraft(item.id);
        if (!md) return send(res, 404, '본문 없음', 'text/plain; charset=utf-8');
        if (item.kind === 'blog') {
          const v = validateArticle(md, { rules: readJSON('data/newsletterRules.json'), copy });
          if (v.ok) return send(res, 200, renderArticle(v.article, { copy, siteRoot: '/site/' }));
        }
        return send(res, 200, layout({ title: '미리보기', csrf: session.csrf, body: `<section class="panel"><h1>원문 미리보기</h1><pre>${esc(md)}</pre></section>` }));
      }

      if (path === '/') {
        const tab = url.searchParams.get('tab') || 'queue';
        if (tab === 'sources') return send(res, 200, sourcesPage({ sources: readJSON('ops/sources/index.json'), csrf: session.csrf, queueCount }));
        if (tab === 'dictionary') return send(res, 200, dictionaryPage({ dict, csrf: session.csrf, queueCount }));
        if (tab === 'logs') return send(res, 200, logsPage({ logs: service.store.logs(), csrf: session.csrf, queueCount }));
        const id = url.searchParams.get('id');
        const selected = id ? service.store.get(id) : null;
        const t = selected ? (selected.state === 'approved_scheduled' ? 'scheduled' : selected.state === 'published' ? 'published' : 'queue') : ['queue', 'scheduled', 'published'].includes(tab) ? tab : 'queue';
        return send(res, 200, queuePage({
          items: tabItems(items, t), tab: t, csrf: session.csrf, now: now(), selected,
          md: selected ? service.store.readDraft(selected.id) : null,
          message: selected && ['approved_scheduled', 'published'].includes(selected.state) ? service.messageText(selected.id) : null,
          msg, queueCount,
        }));
      }
      return send(res, 404, '없는 페이지입니다.', 'text/plain; charset=utf-8');
    } catch (e) {
      if (e instanceof WorkflowError) return send(res, e.status, e.message, 'text/plain; charset=utf-8');
      console.error(e);
      return send(res, 500, '서버 오류', 'text/plain; charset=utf-8');
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const host = process.env.OPS_HOST || '127.0.0.1';
  const port = Number(process.env.OPS_PORT) || 8791;
  const { default: config } = await import('../../assets/config.js');
  const service = createService({ opsRoot: process.env.OPS_ROOT || undefined, siteRoot: process.env.SITE_ROOT || undefined, siteUrl: config.SITE_URL });
  const server = createReviewServer({ service, auth: { user: process.env.OPS_USER, passwordHash: process.env.OPS_PASSWORD_HASH }, cookieSecure: process.env.OPS_COOKIE_SECURE === '1' });
  server.listen(port, host, () => console.log(`검토 대기열: http://${host}:${port}/  (모바일 간이 뷰 /m)`));
}
