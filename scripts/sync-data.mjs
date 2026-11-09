// data/*.json → assets/ 복사 + 브라우저용 ES 모듈(*.data.js) 생성.
// 원본은 data/ 이고 assets/ 쪽은 생성물이다. tests/data-sync.test.mjs 가 일치를 검사한다.
//   node scripts/sync-data.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SYNCED = ['ageRules', 'copy.ko'];
/** 원본이 assets/ 에 있는 데이터(SPEC 파일 구조) — .data.js 모듈만 만든다 */
export const ASSET_SOURCED = ['healthData'];

export function moduleSource(name, json, from = `data/${name}.json`) {
  return `// 생성 파일 — 직접 고치지 않는다. 원본: ${from} (node scripts/sync-data.mjs)\nexport default ${JSON.stringify(JSON.parse(json), null, 2)};\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const name of SYNCED) {
    const json = readFileSync(join(root, 'data', `${name}.json`), 'utf8');
    writeFileSync(join(root, 'assets', `${name}.json`), json);
    writeFileSync(join(root, 'assets', `${name}.data.js`), moduleSource(name, json));
    console.log(`synced ${name}`);
  }
  for (const name of ASSET_SOURCED) {
    const json = readFileSync(join(root, 'assets', `${name}.json`), 'utf8');
    writeFileSync(join(root, 'assets', `${name}.data.js`), moduleSource(name, json, `assets/${name}.json`));
    console.log(`synced ${name}`);
  }
}
