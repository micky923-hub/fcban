// content/weekly.json → index.html 의 <script type="application/json" id="weekly-data"> 안에 넣는다.
// 허브가 실행 중에 따로 요청하지 않도록(서버 호출 0, LCP) 빌드 때 정적으로 심는다.
// 파일이 없거나 형식이 틀리면 비운다 → 허브는 '이번 주 다이어리' 영역을 숨긴다.
//   node scripts/inline-weekly.mjs [--from <weekly.json 경로>]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { normalizeWeekly } from '../assets/hub.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const RE = /(<script type="application\/json" id="weekly-data">)[\s\S]*?(<\/script>)/;

/** JSON 을 <script> 안에 안전하게 넣는 문자열로 */
export function inlineJSON(obj) {
  return obj ? JSON.stringify(obj).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') : '';
}

export function inlineWeekly(html, weeklyRaw) {
  if (!RE.test(html)) throw new Error('index.html 에 weekly-data 자리가 없습니다');
  const w = normalizeWeekly(weeklyRaw);
  return html.replace(RE, (_, a, b) => `${a}${inlineJSON(w)}${b}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--from');
  const src = i > 0 ? resolve(process.argv[i + 1]) : join(root, 'content', 'weekly.json');
  const raw = existsSync(src) ? JSON.parse(readFileSync(src, 'utf8')) : null;
  const file = join(root, 'index.html');
  const out = inlineWeekly(readFileSync(file, 'utf8'), raw);
  writeFileSync(file, out);
  console.log(normalizeWeekly(raw) ? `weekly: ${normalizeWeekly(raw).slug}` : 'weekly: (없음 — 영역 숨김)');
}
