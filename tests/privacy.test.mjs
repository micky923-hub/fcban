// 고객 화면 전체: 서버 전송·영구 저장·추적 코드가 없는지 검사(주석 제외).
// sessionStorage 는 assets/handoff.js(나이대 1회 전달)에서만 허용한다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from './_load.mjs';

const GENERATED = /\.data\.js$/;
function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(m?js|html)$/.test(name) && !GENERATED.test(name)) yield p;
  }
}
const files = [join(ROOT, 'index.js'), join(ROOT, 'index.html'), join(ROOT, '404.html'), ...['assets', 'calendar', 'health', 'estate', 'diary'].flatMap((d) => [...walk(join(ROOT, d))])].filter(existsSync);
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');

const BANNED = [/\bfetch\s*\(/, /XMLHttpRequest/, /sendBeacon/, /localStorage/, /indexedDB/, /document\.cookie/, /<form[^>]+action=/i, /URLSearchParams/, /location\.search/, /new\s+WebSocket/, /gtag|googletagmanager|google-analytics/i];

for (const f of files) {
  const rel = relative(ROOT, f);
  test(`${rel}: 서버 전송·저장·추적 코드 없음`, () => {
    const src = strip(readFileSync(f, 'utf8'));
    for (const bad of BANNED) assert.ok(!bad.test(src), `${bad}`);
    if (rel !== 'assets/handoff.js') assert.ok(!/sessionStorage/.test(src), 'sessionStorage 는 handoff.js 에서만');
  });
}

test('sw.js: 정적 파일 캐시만 — 저장소·쿠키·외부 전송 없음', () => {
  const src = strip(readFileSync(join(ROOT, 'sw.js'), 'utf8'));
  for (const bad of [/localStorage/, /sessionStorage/, /indexedDB/, /document\.cookie/, /sendBeacon/, /XMLHttpRequest/, /method:\s*['"]POST/i]) assert.ok(!bad.test(src), String(bad));
});
