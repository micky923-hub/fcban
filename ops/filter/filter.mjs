// Node 용 검사기: 사전·소스 색인·카피를 읽어 core.checkText 에 넘긴다.
// scripts/build.mjs 가 원고마다 checkText(md) 를 호출한다(block 이면 빌드 실패).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkText as coreCheck, checkJSONStrings, EXIT } from './core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

let ctxCache = null;
export function context() {
  if (!ctxCache) {
    const copy = readJSON('data/copy.ko.json');
    ctxCache = {
      dict: readJSON('data/forbidden-words.json'),
      sources: readJSON('ops/sources/index.json'),
      copy,
      endingExceptions: [copy.hub.hero], // 허브 히어로만 '하세요' 허용
    };
  }
  return ctxCache;
}

/** @param {string} text @param {{mode?: 'content'|'ui'}} [opts] */
export function checkText(text, opts = {}) {
  return coreCheck(text, { ...context(), ...opts });
}

export function checkJSON(obj) {
  return checkJSONStrings(obj, context());
}

export function meta() {
  const c = context();
  return { filterVersion: c.dict._meta.version, dictUpdatedAt: c.dict._meta.updatedAt, sources: c.sources.sources.length };
}

export { EXIT };
