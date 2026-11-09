// assets/ 의 JSON 복사본과 *.data.js 모듈이 data/ 원본과 같은지 검사한다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readJSON } from './_load.mjs';
import { SYNCED } from '../scripts/sync-data.mjs';

for (const name of SYNCED) {
  test(`assets/${name}.json = data/${name}.json`, () => {
    assert.equal(readFileSync(join(ROOT, 'assets', `${name}.json`), 'utf8'), readFileSync(join(ROOT, 'data', `${name}.json`), 'utf8'));
  });
  test(`assets/${name}.data.js = data/${name}.json`, async () => {
    const mod = await import(join(ROOT, 'assets', `${name}.data.js`));
    assert.deepEqual(mod.default, readJSON(`data/${name}.json`));
  });
}
