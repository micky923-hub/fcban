// 에이전트(초안 작성자)용 CLI — 서버는 AI를 직접 호출하지 않는다. 에이전트는 이 CLI로만 대기열에 넣는다.
//   node ops/review/agent.mjs list                          # 에이전트가 할 일(개요 재작성·본문 작성 요청)
//   node ops/review/agent.mjs submit-outline <outline.json> [--id <ID>]   # 제목 3안·목차·출처 ID
//   node ops/review/agent.mjs submit-draft <ID> <draft.md>  # 본문 제출 → 즉시 슬롯·금지어·근거 검사
// 에이전트는 승인·발행을 할 수 없다(그 동작은 로그인한 운영자 화면에만 있다).
import { readFileSync } from 'node:fs';
import { createService } from './service.mjs';

const [cmd, ...rest] = process.argv.slice(2);
const svc = createService({ opsRoot: process.env.OPS_ROOT || undefined });
const flag = (k) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : null; };

try {
  if (cmd === 'list') {
    const todo = svc.store.list().filter((i) => ['outline_rework', 'draft_requested'].includes(i.state));
    // 재작성 요청이면 직전 검사 결과(검출 단어·위치·문장, 슬롯 오류)를 함께 준다 — 에이전트가 대안 문장 + 출처 ID 로 고친다(SB-12 ③)
    const lastCheck = (c) => (c ? { verdict: c.verdict, counts: c.counts, slotErrors: c.slotErrors, findings: c.findings } : null);
    console.log(JSON.stringify(todo.map((i) => ({ id: i.id, kind: i.kind, state: i.state, chosenTitle: i.chosenTitle || null, outline: i.outline, requestNote: i.requestNote || null, lastCheck: lastCheck(i.check) })), null, 2));
  } else if (cmd === 'submit-outline') {
    const item = svc.submitOutline(JSON.parse(readFileSync(rest[0], 'utf8')), { id: flag('--id') });
    console.log(`${item.id} ${item.state}`);
  } else if (cmd === 'submit-draft') {
    const item = svc.submitDraft(rest[0], readFileSync(rest[1], 'utf8'));
    console.log(`${item.id} ${item.state} (${item.check.verdict}) ${JSON.stringify(item.check.counts)}`);
    if (item.check.slotErrors.length) item.check.slotErrors.forEach((e) => console.log(`  슬롯: ${e}`));
  } else {
    console.error('사용법: agent.mjs list | submit-outline <json> [--id ID] | submit-draft <ID> <md>');
    process.exit(64);
  }
} catch (e) {
  console.error(e.message);
  process.exit(e.status === 400 ? 2 : 1);
}
