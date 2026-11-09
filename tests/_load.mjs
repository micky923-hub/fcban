// 테스트 공용: 저장소 루트 기준 JSON 읽기
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/** 저장소 루트 기준 상대 경로를 OS 와 상관없이 '/' 로 — 윈도우의 '\' 때문에 비교가 어긋나지 않게 */
export const relPath = (abs) => relative(ROOT, abs).split(sep).join('/');
export const readJSON = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
