// 금지어·근거 검사 웹 화면(SB-12) 로컬 서버 — 운영자 전용.
//   node ops/filter/serve.mjs [port]   → http://127.0.0.1:8790/
// - 127.0.0.1 에만 연다(Tailscale 노출·로그인은 순서 7 ops/review 에서).
// - 정적 파일 몇 개만 내준다. 검사는 브라우저 안에서 core.mjs 로 하며, 원고를 서버로 받지 않는다(POST 없음).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const port = Number(process.argv[2]) || 8790;
const FILES = {
  '/': ['ops/filter/web/index.html', 'text/html; charset=utf-8'],
  '/app.js': ['ops/filter/web/app.js', 'text/javascript; charset=utf-8'],
  '/core.mjs': ['ops/filter/core.mjs', 'text/javascript; charset=utf-8'],
  '/base.css': ['assets/base.css', 'text/css; charset=utf-8'],
  '/data/forbidden-words.json': ['data/forbidden-words.json', 'application/json; charset=utf-8'],
  '/data/copy.ko.json': ['data/copy.ko.json', 'application/json; charset=utf-8'],
  '/data/sources-index.json': ['ops/sources/index.json', 'application/json; charset=utf-8'],
};

createServer(async (req, res) => {
  const path = new URL(req.url, 'http://x').pathname;
  const hit = FILES[path];
  if (req.method !== 'GET' || !hit) { res.writeHead(req.method === 'GET' ? 404 : 405).end(); return; }
  try {
    const body = await readFile(join(ROOT, hit[0]));
    res.writeHead(200, { 'content-type': hit[1], 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' }).end(body);
  } catch {
    res.writeHead(500).end();
  }
}).listen(port, '127.0.0.1', () => console.log(`금지어·근거 검사: http://127.0.0.1:${port}/`));
