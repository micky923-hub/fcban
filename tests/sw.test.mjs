// 서비스워커 동작 검사 — sw.js 를 가짜 브라우저 환경(vm)에서 실제로 돌린다.
// 재현하는 상황: 배포 직후 CDN 이 쿼리 없는 주소에는 아직 이전 파일을 주고, 쿼리를 붙인 주소에만 새 파일을 준다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { ROOT } from './_load.mjs';

const SRC = readFileSync(join(ROOT, 'sw.js'), 'utf8');
const VERSION = /const VERSION = '([^']+)'/.exec(SRC)[1];
const SCOPE = 'https://diary.test/';
const keyOf = (r) => (typeof r === 'string' ? r : r.url);

/** 이름별 캐시 저장소. 값은 본문 문자열만 보관한다 */
function fakeCaches(store = new Map()) {
  const open = async (name) => {
    if (!store.has(name)) store.set(name, new Map());
    const m = store.get(name);
    return {
      put: async (req, res) => { m.set(keyOf(req), await res.text()); },
      match: async (req) => (m.has(keyOf(req)) ? new Response(m.get(keyOf(req))) : undefined),
    };
  };
  return {
    store,
    open,
    keys: async () => [...store.keys()],
    delete: async (name) => store.delete(name),
    match: async (req) => {
      for (const m of store.values()) if (m.has(keyOf(req))) return new Response(m.get(keyOf(req)));
      return undefined;
    },
  };
}

/** 쿼리가 있으면 새 배포, 없으면 CDN 의 이전 파일을 준다. 오프라인이면 실패 */
function staleCdnFetch({ offline = false, log = [] } = {}) {
  return async (req) => {
    const url = new URL(keyOf(req));
    log.push(url.href);
    if (offline) throw new TypeError('offline');
    return new Response(`${url.search ? 'NEW' : 'OLD'} ${url.pathname}`);
  };
}

function loadSW({ caches, fetch }) {
  const listeners = {};
  const self = {
    registration: { scope: SCOPE },
    location: { origin: new URL(SCOPE).origin },
    addEventListener: (type, fn) => { listeners[type] = fn; },
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  };
  vm.runInNewContext(SRC, { self, caches, fetch, Request, Response, URL, encodeURIComponent, console });
  return listeners;
}

async function install(listeners) {
  const waits = [];
  listeners.install({ waitUntil: (p) => waits.push(p) });
  await Promise.all(waits);
}

/** fetch 이벤트를 보내고 응답 본문과 뒤에서 도는 작업을 돌려준다 */
async function request(listeners, url, mode = 'cors') {
  let responded = null;
  const waits = [];
  listeners.fetch({ request: { method: 'GET', url, mode }, respondWith: (p) => { responded = p; }, waitUntil: (p) => waits.push(p) });
  const res = responded ? await responded : null;
  const body = res ? await res.text() : null;
  await Promise.all(waits);
  return body;
}

test('설치: 배포 직후 CDN 이 이전 파일을 줘도 새 VERSION 캐시에는 새 파일만 담긴다', async () => {
  const caches = fakeCaches();
  const log = [];
  await install(loadSW({ caches, fetch: staleCdnFetch({ log }) }));
  const cache = caches.store.get(VERSION);
  assert.equal(cache.get(`${SCOPE}index.js`), 'NEW /index.js');
  assert.equal(cache.get(SCOPE), 'NEW /');
  assert.ok([...cache.keys()].every((k) => !k.includes('?')), '캐시 키에는 쿼리가 없다');
  assert.ok(log.every((u) => u.includes(`?v=${encodeURIComponent(VERSION)}`)), '설치 요청은 모두 ?v=VERSION');
});

test('허브·도구 화면: 캐시가 있으면 HTML 도 같은 묶음에서 — 새 HTML 과 이전 스크립트가 섞이지 않는다', async () => {
  const caches = fakeCaches();
  const sw = loadSW({ caches, fetch: staleCdnFetch() });
  await install(sw);
  for (const page of ['', 'calendar/', 'health/', 'estate/']) {
    assert.equal(await request(sw, SCOPE + page, 'navigate'), `NEW /${page}`, page || '허브');
  }
  assert.equal(await request(sw, `${SCOPE}index.js`), 'NEW /index.js', '스크립트도 같은 묶음');
});

test('허브·도구 화면: 뒤에서 받은 새 HTML 은 다음 방문에 보인다', async () => {
  const store = new Map([[VERSION, new Map([[SCOPE, 'CACHED /']])]]);
  const caches = fakeCaches(store);
  const sw = loadSW({ caches, fetch: async () => new Response('LATEST /') });
  assert.equal(await request(sw, SCOPE, 'navigate'), 'CACHED /', '이번 방문은 캐시');
  assert.equal(store.get(VERSION).get(SCOPE), 'LATEST /', '뒤에서 갱신');
  assert.equal(await request(sw, SCOPE, 'navigate'), 'LATEST /', '다음 방문은 새 화면');
});

test('오프라인: 캐시가 없는 허브는 404, 캐시가 있으면 캐시', async () => {
  const empty = loadSW({ caches: fakeCaches(new Map([[VERSION, new Map([[`${SCOPE}404.html`, '404']])]])), fetch: staleCdnFetch({ offline: true }) });
  assert.equal(await request(empty, SCOPE, 'navigate'), '404');
  const cached = loadSW({ caches: fakeCaches(new Map([[VERSION, new Map([[SCOPE, 'CACHED /']])]])), fetch: staleCdnFetch({ offline: true }) });
  assert.equal(await request(cached, SCOPE, 'navigate'), 'CACHED /');
});

test('그 밖의 화면(뉴스레터 글)은 네트워크 우선 그대로', async () => {
  const store = new Map([[VERSION, new Map([[`${SCOPE}diary/a/`, 'CACHED post']])]]);
  const sw = loadSW({ caches: fakeCaches(store), fetch: async () => new Response('LATEST post') });
  assert.equal(await request(sw, `${SCOPE}diary/a/`, 'navigate'), 'LATEST post');
});
