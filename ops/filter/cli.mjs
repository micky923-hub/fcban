// 금지어·근거 검사 CLI (SB-12)
//   node ops/filter/cli.mjs <file.md|file.json|file.txt> [...] [--ui] [--quiet]
// - .md/.txt: 콘텐츠 검사(1·2군 + 근거 + 필수 요건). --ui 면 1·2군·어미만.
// - .json: 문자열 값을 경로와 함께 'ui' 모드로 검사(사이트 카피용).
// - 출력: JSON 결과. exit code: 0 pass / 1 warn / 2 block (여러 파일이면 가장 나쁜 값).
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { checkText, checkJSON, meta, EXIT } from './filter.mjs';

const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith('--'));
const ui = args.includes('--ui');
const quiet = args.includes('--quiet');
if (!files.length) {
  console.error('사용법: node ops/filter/cli.mjs <파일> [...] [--ui] [--quiet]');
  process.exit(64);
}

let worst = 0;
const results = [];
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  const r = extname(f) === '.json' ? checkJSON(JSON.parse(text)) : checkText(text, { mode: ui ? 'ui' : 'content' });
  worst = Math.max(worst, EXIT[r.verdict]);
  results.push({ file: f, ...r, findings: r.findings.map(({ start, end, ...rest }) => rest) });
}
const out = { ...meta(), verdict: Object.keys(EXIT).find((k) => EXIT[k] === worst), results };
if (quiet) {
  for (const r of results) {
    console.log(`${r.verdict.toUpperCase().padEnd(5)} ${r.file}  (1군 ${r.findings.filter((x) => x.tier === '1').length} · 근거 ${r.findings.filter((x) => x.tier === 'evidence').length} · 필수 ${r.findings.filter((x) => x.tier === 'required').length} · 2군 ${r.findings.filter((x) => x.tier === '2').length} · 어미 ${r.findings.filter((x) => x.tier === 'ending').length})`);
  }
} else {
  console.log(JSON.stringify(out, null, 2));
}
process.exit(worst);
