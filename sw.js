// 서비스워커 (SB-13) — 허브와 도구 3개를 완전 오프라인으로 동작시킨다.
// - 같은 출처의 GET 정적 파일만 캐시한다. 입력값·결과값은 어떤 요청에도 실리지 않으므로 캐시에도 없다.
// - 다른 출처(카카오 SDK 등)는 건드리지 않는다 → 오프라인이면 공유 버튼만 비활성.
// - 허브·도구 3개 화면(PAGES)은 캐시 우선 + 뒤에서 새로 받기 — HTML 과 스크립트를 같은 VERSION 묶음에서 꺼내,
//   새 HTML 에 이전 스크립트가 섞여 화면이 깨지는 일을 막는다. 새 배포는 다음 방문부터 보인다.
// - 그 밖의 화면(뉴스레터 글 등)은 네트워크 우선 → 실패하면 캐시 → 그래도 없으면 404.html.
// - 정적 파일은 캐시 우선 + 뒤에서 새로 받기(stale-while-revalidate).
// 설치 때는 주소에 ?v=VERSION 을 붙여 브라우저 HTTP 캐시와 CDN 캐시(GitHub Pages max-age=600)를 모두 건너뛴다 —
// 배포 직후 CDN 이 몇 분간 이전 파일을 주는 동안에도 새 VERSION 캐시에 이전 파일이 담기지 않게. 캐시 키는 쿼리 없는 주소.
// 고객 화면 파일(목록 또는 내용 — 데이터 포함)이 바뀌어 배포할 때마다 VERSION 을 올린다.
// 올리지 않으면 이미 방문한 기기는 이전 파일을 먼저 보여 준다(OPEN_QUESTIONS Q53).
// tests/offline.test.mjs 가 목록의 파일이 실제로 있는지 검사한다.
const VERSION = 'fd-2026-11-10-10';
const PRECACHE = [
  './',
  'calendar/',
  'health/',
  'estate/',
  '404.html',
  'index.js',
  'calendar/calendar.js',
  'health/health.js',
  'estate/estate.js',
  'assets/base.css',
  'assets/ui.js',
  'assets/config.js',
  'assets/copy.ko.data.js',
  'assets/ageCalendar.js',
  'assets/ageRules.data.js',
  'assets/handoff.js',
  'assets/hub.js',
  'assets/health.js',
  'assets/healthData.data.js',
  'assets/estate.js',
  'assets/taxRules.data.js',
  'favicon.ico',
  'assets/icons/favicon-32.png',
  'assets/icons/apple-touch-icon.png',
];

const scopeURL = (p) => new URL(p, self.registration.scope).href;
/** HTML 과 스크립트를 같은 묶음으로 보여 줄 화면(사전 캐시된 화면) */
const PAGES = new Set(['./', 'calendar/', 'health/', 'estate/'].map(scopeURL));

/** 사전 캐시 1건: CDN·HTTP 캐시를 건너뛴 새 파일을 쿼리 없는 주소로 저장. 하나라도 실패하면 설치 실패(다음에 다시 시도) */
async function precacheOne(cache, p) {
  const res = await fetch(new Request(`${scopeURL(p)}?v=${encodeURIComponent(VERSION)}`, { cache: 'reload' }));
  if (!res.ok) throw new Error(`precache ${p}: ${res.status}`);
  await cache.put(scopeURL(p), res);
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => Promise.all(PRECACHE.map((p) => precacheOne(c, p)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('fd-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.search) return; // 쿼리가 붙은 요청은 캐시하지 않는다(고객 화면은 쿼리를 쓰지 않는다)

  if (req.mode === 'navigate' && PAGES.has(url.href)) {
    event.respondWith(caches.open(VERSION).then(async (c) => {
      const hit = await c.match(url.href);
      const fresh = fetch(req).then((res) => {
        if (res.ok) c.put(url.href, res.clone());
        return res;
      });
      if (hit) {
        event.waitUntil(fresh.catch(() => {})); // 다음 방문용으로 뒤에서 갱신
        return hit;
      }
      return fresh.catch(() => caches.match(scopeURL('404.html')));
    }));
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match(scopeURL('404.html')))),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      const fresh = fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
          return res;
        })
        .catch(() => hit || Response.error()); // 오프라인: 캐시가 있으면 그것을 쓴다
      return hit || fresh;
    }),
  );
});
