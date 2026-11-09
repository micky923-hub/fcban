// 서비스워커 (SB-13) — 허브와 도구 3개를 완전 오프라인으로 동작시킨다.
// - 같은 출처의 GET 정적 파일만 캐시한다. 입력값·결과값은 어떤 요청에도 실리지 않으므로 캐시에도 없다.
// - 다른 출처(카카오 SDK 등)는 건드리지 않는다 → 오프라인이면 공유 버튼만 비활성.
// - 화면(HTML)은 네트워크 우선 → 실패하면 캐시 → 그래도 없으면 404.html.
// - 정적 파일은 캐시 우선 + 뒤에서 새로 받기(stale-while-revalidate).
// 고객 화면 파일(목록 또는 내용 — 데이터 포함)이 바뀌어 배포할 때마다 VERSION 을 올린다.
// 올리지 않으면 이미 방문한 기기는 이전 파일을 먼저 보여 준다(OPEN_QUESTIONS Q53).
// tests/offline.test.mjs 가 목록의 파일이 실제로 있는지 검사한다.
const VERSION = 'fd-2026-11-09-8';
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
];

const scopeURL = (p) => new URL(p, self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE.map(scopeURL))).then(() => self.skipWaiting()));
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
