// 검토 대기열 서비스: 저장소 + 상태 전환 + 검사 + 빌드를 묶는다. 서버와 에이전트 CLI가 같이 쓴다.
// 발행(빌드)은 운영자의 '발행' 클릭(act('publish'))에서만 실행된다. 이 파일에 타이머·스케줄러는 없다.
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createStore, newId } from './store.mjs';
import { apply, WorkflowError } from './workflow.mjs';
import { checkDraft, stateForVerdict, setFrontMatter, validateOutline } from './checks.mjs';
import { build, loadFilter } from '../../scripts/build.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const copy = JSON.parse(readFileSync(join(ROOT, 'data', 'copy.ko.json'), 'utf8'));

const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * @param {object} o
 * @param {string} o.opsRoot   ops 폴더(drafts/approved/published/logs 가 있는 곳)
 * @param {string} o.siteRoot  고객 사이트 저장소 루트(content/, diary/, index.html)
 * @param {string} [o.siteUrl] 공용 사이트 주소(메시지 복사용)
 */
export function createService({ opsRoot = join(ROOT, 'ops'), siteRoot = ROOT, siteUrl = '' } = {}) {
  const store = createStore(opsRoot);

  function submitOutline(outline, { id = null, now = new Date(), by = 'agent' } = {}) {
    const errors = validateOutline(outline);
    if (errors.length) throw new WorkflowError(`개요 검사 실패: ${errors.join(' / ')}`, 400);
    let item;
    if (id) {
      item = store.get(id);
      if (!item) throw new WorkflowError(`항목 없음: ${id}`, 404);
      if (item.state !== 'outline_rework') throw new WorkflowError('개요 재작성 요청 상태에서만 다시 제출할 수 있습니다.');
      item.state = 'outline_pending';
    } else {
      item = { id: newId(now), kind: outline.kind, state: 'outline_pending', createdAt: now.toISOString(), history: [] };
    }
    item.kind = outline.kind;
    item.outline = { titles: outline.titles.map(String), toc: outline.toc.map(String), sourceIds: outline.sourceIds.map(String), category: outline.category || null, tool: outline.tool || null, note: outline.note || null };
    item.updatedAt = now.toISOString();
    item.history = [...(item.history || []), { at: item.updatedAt, action: 'outline_submit', by, note: null }];
    return store.save(item);
  }

  /** 에이전트 본문 제출 → 검사 → draft_pending | warned | blocked */
  function submitDraft(id, md, { now = new Date(), by = 'agent' } = {}) {
    const item = store.get(id);
    if (!item) throw new WorkflowError(`항목 없음: ${id}`, 404);
    if (item.state !== 'draft_requested') throw new WorkflowError('본문 작성 요청 상태에서만 제출할 수 있습니다.');
    store.writeDraft(id, md);
    const check = checkDraft(md, item.kind, now);
    const next = { ...item, check, state: stateForVerdict(check.verdict), updatedAt: now.toISOString(), requestNote: null };
    next.history = [...(item.history || []), { at: next.updatedAt, action: 'draft_submit', by, note: `검사 ${check.verdict}` }];
    store.save(next);
    store.log({ contentId: id, at: next.updatedAt, approver: by, action: 'draft_submit', filter: { verdict: check.verdict, version: check.filterVersion, counts: check.counts } });
    return next;
  }

  /** 운영자 동작. 승인·발행 직전에는 검사를 다시 돌린다(원고가 바뀌었을 수 있다). */
  async function act(id, action, payload, now = new Date()) {
    let item = store.get(id);
    if (!item) throw new WorkflowError(`항목 없음: ${id}`, 404);

    if (action === 'approve' || action === 'publish') {
      const md = store.readDraft(id);
      if (!md) throw new WorkflowError('본문이 없습니다.');
      const check = checkDraft(md, item.kind, now);
      if (check.verdict === 'block') {
        item = { ...item, check, state: 'blocked', updatedAt: now.toISOString() };
        store.save(item);
        throw new WorkflowError('다시 검사한 결과 차단입니다. 승인·발행할 수 없습니다.');
      }
      item = { ...item, check };
    }

    // 허용 여부(예약 시각·차단 등)를 먼저 확인한다 — 빌드 같은 부수 효과는 그 뒤에만
    const { item: next, log } = apply(item, action, payload, now);

    if (action === 'publish') {
      // 블로그: content/{slug}.md 로 옮기고 빌드. 빌드가 실패하면 상태를 바꾸지 않는다.
      if (item.kind === 'blog') {
        const md = store.readDraft(id);
        const slug = item.check.article.slug;
        mkdirSync(join(siteRoot, 'content'), { recursive: true });
        const target = join(siteRoot, 'content', `${slug}.md`);
        if (existsSync(target)) throw new WorkflowError(`content/${slug}.md 가 이미 있습니다(slug 중복).`);
        writeFileSync(target, md);
        // 실패하면 넣은 원고를 다시 빼서, 다음 빌드 때 승인 클릭 없이 발행되는 일이 없게 한다
        const undo = (msg) => { unlinkSync(target); return new WorkflowError(msg, 500); };
        const filter = await loadFilter();
        const r = build({ root: siteRoot, contentDir: join(siteRoot, 'content'), today: localDate(now), filter });
        if (!r.ok) throw undo(`빌드 실패: ${r.errors.join(' / ')}`);
        if (!r.pages.some((p) => p.path.includes(slug))) throw undo(`빌드는 됐지만 ${slug} 페이지가 만들어지지 않았습니다: ${r.log.join(' / ')}`);
      }
    }

    if (action === 'approve' && next.kind === 'blog') {
      const publishDate = localDate(new Date(next.schedule.publishAt));
      store.writeDraft(id, setFrontMatter(store.readDraft(id), { approvedAt: localDate(now), approvedBy: payload.by, publishedAt: publishDate }));
      next.check = checkDraft(store.readDraft(id), next.kind, now);
    }
    store.save(next);
    store.log(log);
    return next;
  }

  /** SB-10 주간 채널 메시지 — 제목·요약·버튼 2개(글 읽기 / 도구 1개). 발송은 사람이 카카오 채널 관리자에서 */
  function messageText(id) {
    const item = store.get(id);
    if (!item || item.kind !== 'blog' || !item.check?.article) return null;
    const a = item.check.article;
    const base = siteUrl ? siteUrl.replace(/\/?$/, '/') : '(SITE_URL 미설정)/';
    const tool = copy.hub.tools.find((t) => t.id === a.tool);
    const [readBtn, toolBtn] = copy.kakao.weeklyButtons;
    return [
      `[${a.weekLabel} 다이어리]`,
      a.title,
      ...a.summary.map((l) => l.replace(/\s*\[S-[A-Z]{2,5}-\d{2}\]/g, '')),
      '',
      `버튼 1 · ${readBtn}: ${base}diary/${a.slug}/`,
      `버튼 2 · ${toolBtn.replace('{toolName}', tool ? tool.title : a.tool)}: ${base}${tool ? tool.path.replace(/^\//, '') : ''}`,
    ].join('\n');
  }

  return { store, submitOutline, submitDraft, act, messageText };
}
