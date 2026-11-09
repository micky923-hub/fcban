// 검토 대기열 상태 전환 (SB-11, F4-6) — 순수 함수. 화면(버튼 렌더)과 서버(요청 처리)가 같은 규칙을 쓴다.
//
// outline_pending ──개요 승인──▶ draft_requested ──(에이전트 본문 제출 + 검사)──▶ draft_pending | warned | blocked
//        └─개요 반려──▶ outline_rework ──(에이전트 개요 재제출)──▶ outline_pending
// draft_pending/warned ──승인·예약──▶ approved_scheduled ──발행(예약 시각 이후 운영자 클릭)──▶ published
// draft_pending/warned/blocked ──수정 요청──▶ draft_requested (재작성 큐)
//
// - blocked(1군·근거·슬롯 위반)에는 승인 동작이 없다. 화면에 버튼이 없고, 서버도 거절한다.
// - warned(2군)는 사유를 적어야 승인된다(로그에 남는다).
// - 발행은 운영자 클릭으로만. 예약 시각은 '이 시각 이후 발행 가능'이라는 표시일 뿐, 자동 실행되지 않는다.

export const STATES = ['outline_pending', 'outline_rework', 'draft_requested', 'draft_pending', 'warned', 'blocked', 'approved_scheduled', 'published'];

export const STATE_LABEL = {
  outline_pending: '개요 대기',
  outline_rework: '개요 재작성 중',
  draft_requested: '본문 작성 중',
  draft_pending: '금지어·근거 통과',
  warned: '2군 경고',
  blocked: '차단',
  approved_scheduled: '발행 예정',
  published: '발행 완료',
};

export const KIND_LABEL = { blog: '블로그', message: '채널 메시지', cardnews: '카드뉴스' };

export const isDue = (item, now = new Date()) => Boolean(item.schedule?.publishAt) && new Date(item.schedule.publishAt) <= now;

/** 상태별로 허용되는 동작 (화면은 이 목록에 있는 버튼만 렌더한다) */
export function allowedActions(item, now = new Date()) {
  switch (item.state) {
    case 'outline_pending': return ['outline_save', 'outline_approve', 'outline_reject'];
    case 'draft_pending': return ['approve', 'request_revision'];
    case 'warned': return ['approve', 'request_revision'];
    case 'blocked': return ['request_revision'];
    case 'approved_scheduled': return isDue(item, now) ? ['publish'] : [];
    default: return [];
  }
}

export class WorkflowError extends Error {
  constructor(message, status = 409) { super(message); this.status = status; }
}

/** 상태별 수 */
export function counts(items) {
  const c = Object.fromEntries(STATES.map((s) => [s, 0]));
  for (const i of items) c[i.state] += 1;
  return c;
}

/** 탭별 항목: queue(대기열) | scheduled(발행 예정) | published(발행 완료) */
export function tabItems(items, tab) {
  if (tab === 'scheduled') return items.filter((i) => i.state === 'approved_scheduled');
  if (tab === 'published') return items.filter((i) => i.state === 'published');
  return items.filter((i) => !['approved_scheduled', 'published'].includes(i.state));
}

/**
 * 동작 적용 → 새 item + 승인 로그 항목. 허용되지 않으면 WorkflowError.
 * @param {object} item
 * @param {string} action
 * @param {object} payload  { by, reason?, note?, title?, publishAt?, outline? }
 * @param {Date} now
 */
export function apply(item, action, payload, now = new Date()) {
  if (!allowedActions(item, now).includes(action)) {
    if (action === 'approve' && item.state === 'blocked') throw new WorkflowError('차단 항목은 승인할 수 없습니다(1군·근거·슬롯 위반). 수정 요청만 가능합니다.');
    if (action === 'publish' && item.state === 'approved_scheduled') throw new WorkflowError('발행 시각 전입니다.');
    throw new WorkflowError(`'${STATE_LABEL[item.state] || item.state}' 상태에서는 '${action}' 을(를) 할 수 없습니다.`);
  }
  const by = String(payload.by || '').trim();
  if (!by) throw new WorkflowError('승인자 정보가 없습니다.', 401);
  const at = now.toISOString();
  const next = structuredClone(item);
  // 로그는 콘텐츠 ID·시각·승인자·동작·필터 결과만 (SB-11 ⑥)
  const entry = { contentId: item.id, at, approver: by, action, filter: item.check ? { verdict: item.check.verdict, version: item.check.filterVersion, counts: item.check.counts } : null };

  switch (action) {
    case 'outline_save': {
      const o = payload.outline || {};
      const titles = (o.titles || []).map((t) => String(t).trim()).filter(Boolean);
      if (titles.length < 1) throw new WorkflowError('제목안이 비었습니다.', 400);
      next.outline = {
        ...next.outline,
        titles,
        toc: (o.toc || []).map((t) => String(t).trim()).filter(Boolean),
        sourceIds: (o.sourceIds || []).map((t) => String(t).trim()).filter(Boolean),
      };
      break;
    }
    case 'outline_approve': {
      const title = String(payload.title || '').trim();
      if (!next.outline.titles.includes(title)) throw new WorkflowError('제목안 중 하나를 골라야 합니다.', 400);
      next.chosenTitle = title;
      next.state = 'draft_requested';
      break;
    }
    case 'outline_reject':
      next.state = 'outline_rework';
      next.requestNote = String(payload.note || '').trim() || null;
      break;
    case 'request_revision':
      next.state = 'draft_requested';
      next.requestNote = String(payload.note || '').trim() || null;
      break;
    case 'approve': {
      if (!item.check || item.check.verdict === 'block') throw new WorkflowError('검사 결과가 차단이거나 없습니다.');
      const reason = String(payload.reason || '').trim();
      if (item.state === 'warned' && !reason) throw new WorkflowError('2군 경고 항목은 통과 사유를 적어야 승인됩니다.', 400);
      const publishAt = payload.publishAt ? new Date(payload.publishAt) : null;
      if (!publishAt || Number.isNaN(publishAt.getTime())) throw new WorkflowError('발행 시각이 필요합니다.', 400);
      next.state = 'approved_scheduled';
      next.schedule = { publishAt: publishAt.toISOString() };
      next.approval = { at, by, reason: reason || null };
      if (reason) entry.reason = reason;
      entry.publishAt = next.schedule.publishAt;
      break;
    }
    case 'publish':
      next.state = 'published';
      next.publishedAt = at;
      break;
    default:
      throw new WorkflowError(`알 수 없는 동작: ${action}`, 400);
  }
  next.updatedAt = at;
  next.history = [...(item.history || []), { at, action, by, note: payload.note || payload.reason || null }];
  return { item: next, log: entry };
}

/** 기본 발행 시각: 다음 목요일 09:00 (SPEC §8-1 기본값) — 서버 로컬 시각 */
export function defaultPublishAt(now = new Date(), weekday = 4, hour = 9) {
  const d = new Date(now);
  d.setHours(hour, 0, 0, 0);
  let add = (weekday - d.getDay() + 7) % 7;
  if (add === 0 && d <= now) add = 7;
  d.setDate(d.getDate() + add);
  return d;
}
