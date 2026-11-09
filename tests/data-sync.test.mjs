// assets/ 의 JSON 복사본과 *.data.js 모듈이 data/ 원본과 같은지 검사한다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, readJSON } from './_load.mjs';

// 윈도우 절대 경로(C:\…)는 import() 에 바로 못 넣는다 — file:// URL 로 바꾼다.
const importAsset = (file) => import(pathToFileURL(join(ROOT, 'assets', file)).href);
import { SYNCED, ASSET_SOURCED } from '../scripts/sync-data.mjs';

for (const name of SYNCED) {
  test(`assets/${name}.json = data/${name}.json`, () => {
    assert.equal(readFileSync(join(ROOT, 'assets', `${name}.json`), 'utf8'), readFileSync(join(ROOT, 'data', `${name}.json`), 'utf8'));
  });
  test(`assets/${name}.data.js = data/${name}.json`, async () => {
    const mod = await importAsset(`${name}.data.js`);
    assert.deepEqual(mod.default, readJSON(`data/${name}.json`));
  });
}

for (const name of ASSET_SOURCED) {
  test(`assets/${name}.data.js = assets/${name}.json`, async () => {
    const mod = await importAsset(`${name}.data.js`);
    assert.deepEqual(mod.default, readJSON(`assets/${name}.json`));
  });
}
