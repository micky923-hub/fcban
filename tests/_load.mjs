// 테스트 공용: 저장소 루트 기준 JSON 읽기
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const readJSON = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
