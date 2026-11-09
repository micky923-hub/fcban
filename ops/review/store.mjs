// 검토 대기열 파일 저장소. 폴더는 ops/{drafts,approved,published,logs} 뿐(CLAUDE.md 규칙 5).
// - 항목 1건 = 폴더 1개: {folder}/{id}/item.json + draft.md
// - 상태에 따라 폴더가 옮겨진다: 작업 중 → drafts, 발행 예정 → approved, 발행 완료 → published
// - 승인 로그: logs/review.jsonl (콘텐츠 ID·시각·승인자·동작·필터 결과)
// - 고객 데이터는 다루지 않는다. 콘텐츠 작업물만.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, renameSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

export const FOLDERS = ['drafts', 'approved', 'published'];
const ID_RE = /^C-\d{8}-[0-9a-f]{6}$/;
export const isValidId = (id) => ID_RE.test(String(id));

const folderFor = (state) => (state === 'published' ? 'published' : state === 'approved_scheduled' ? 'approved' : 'drafts');

export function newId(now = new Date()) {
  const d = now.toISOString().slice(0, 10).replaceAll('-', '');
  return `C-${d}-${randomBytes(3).toString('hex')}`;
}

export function createStore(opsRoot) {
  for (const f of [...FOLDERS, 'logs']) mkdirSync(join(opsRoot, f), { recursive: true });
  const logFile = join(opsRoot, 'logs', 'review.jsonl');

  function locate(id) {
    if (!isValidId(id)) return null;
    for (const f of FOLDERS) {
      const dir = join(opsRoot, f, id);
      if (existsSync(join(dir, 'item.json'))) return { folder: f, dir };
    }
    return null;
  }

  return {
    opsRoot,
    list() {
      const out = [];
      for (const f of FOLDERS) {
        for (const id of readdirSync(join(opsRoot, f))) {
          if (!isValidId(id)) continue;
          const p = join(opsRoot, f, id, 'item.json');
          if (existsSync(p)) out.push(JSON.parse(readFileSync(p, 'utf8')));
        }
      }
      return out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    },
    get(id) {
      const loc = locate(id);
      return loc ? JSON.parse(readFileSync(join(loc.dir, 'item.json'), 'utf8')) : null;
    },
    /** 저장 + 상태에 맞는 폴더로 이동 */
    save(item) {
      if (!isValidId(item.id)) throw new Error(`잘못된 ID: ${item.id}`);
      const want = folderFor(item.state);
      const loc = locate(item.id);
      const dir = join(opsRoot, want, item.id);
      if (loc && loc.folder !== want) renameSync(loc.dir, dir);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'item.json'), `${JSON.stringify(item, null, 2)}\n`);
      return item;
    },
    readDraft(id) {
      const loc = locate(id);
      const p = loc && join(loc.dir, 'draft.md');
      return p && existsSync(p) ? readFileSync(p, 'utf8') : null;
    },
    writeDraft(id, md) {
      const loc = locate(id);
      if (!loc) throw new Error(`항목 없음: ${id}`);
      writeFileSync(join(loc.dir, 'draft.md'), md);
    },
    log(entry) {
      appendFileSync(logFile, `${JSON.stringify(entry)}\n`);
    },
    logs(limit = 200) {
      if (!existsSync(logFile)) return [];
      return readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)).slice(-limit).reverse();
    },
  };
}
