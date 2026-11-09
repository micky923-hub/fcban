// 검토 대기열 화면(SB-11) — 서버에서 HTML 을 만든다. 버튼은 workflow.allowedActions() 가 허용한 것만 렌더한다.
import { allowedActions, STATE_LABEL, KIND_LABEL, defaultPublishAt } from './workflow.mjs';

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const BADGE = { outline_pending: 'b-blue', outline_rework: 'b-muted', draft_requested: 'b-muted', draft_pending: 'b-green', warned: 'b-yellow', blocked: 'b-red', approved_scheduled: 'b-navy', published: 'b-muted' };
const MENU = [['queue', '검토 대기열'], ['scheduled', '발행 예정'], ['published', '발행 완료'], ['sources', '소스 라이브러리'], ['dictionary', '금지어 사전'], ['logs', '로그']];
const TIER = { 1: '1군', 2: '2군', evidence: '근거', ending: '어미', required: '필수' };

const pad = (n) => String(n).padStart(2, '0');
export const localInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmt = (iso) => { if (!iso) return '—'; const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

function form(item, action, csrf, label, { cls = 'btn btn--primary', fields = '', back = '' } = {}) {
  return `<form method="post" action="/item/${esc(item.id)}/${action}" class="inline-form">
    <input type="hidden" name="csrf" value="${esc(csrf)}">${back ? `<input type="hidden" name="back" value="${esc(back)}">` : ''}${fields}
    <button class="${cls}" type="submit"${action === 'publish' ? ' data-confirm="발행하면 고객 사이트 빌드가 실행됩니다. 진행할까요?"' : ''}>${esc(label)}</button></form>`;
}

function summaryLine(item) {
  if (item.state === 'outline_pending' || item.state === 'outline_rework') {
    return `제목 ${item.outline.titles.length}안 · 목차 ${item.outline.toc.length} · 출처 ID ${item.outline.sourceIds.length}`;
  }
  const c = item.check;
  if (!c) return item.requestNote ? `요청: ${item.requestNote}` : '에이전트 작성 중';
  const parts = [];
  if (c.counts.tier1) parts.push(`1군 ${c.counts.tier1}건`);
  if (c.counts.evidence) parts.push(`근거 없음 ${c.counts.evidence}건`);
  if (c.counts.slot) parts.push(`슬롯 ${c.counts.slot}건`);
  if (c.counts.required) parts.push(`필수 ${c.counts.required}건`);
  if (c.counts.tier2) parts.push(`2군 ${c.counts.tier2}건`);
  if (c.counts.ending) parts.push(`어미 ${c.counts.ending}건`);
  if (c.article) parts.push(`출처 ${c.article.sources} · ${c.article.chars.toLocaleString()}자`);
  if (item.schedule?.publishAt) parts.push(`발행 ${fmt(item.schedule.publishAt)}`);
  return parts.join(' · ') || '검출 없음';
}

const itemTitle = (item) => item.check?.article?.title || item.chosenTitle || item.outline?.titles?.[0] || item.id;
const stage = (item) => (['outline_pending', 'outline_rework'].includes(item.state) ? '개요' : '본문');

/** 목록 카드 — 데스크톱 */
export function card(item, csrf, now) {
  const acts = allowedActions(item, now);
  const btns = [];
  if (item.state === 'outline_pending') {
    btns.push(`<a class="btn btn--outline" href="/?id=${esc(item.id)}#edit">개요 수정</a>`);
    btns.push(`<a class="btn btn--primary" href="/?id=${esc(item.id)}#approve">개요 승인 → 본문 생성</a>`);
  } else if (item.check) {
    btns.push(`<a class="btn btn--outline" href="/?id=${esc(item.id)}">${item.state === 'blocked' ? '검사 결과' : '미리보기'}</a>`);
    if (acts.includes('approve')) btns.push(`<a class="btn btn--primary" href="/?id=${esc(item.id)}#approve">승인 · 예약</a>`);
    if (item.state === 'blocked' && acts.includes('request_revision')) btns.push(form(item, 'request_revision', csrf, '수정 요청', { cls: 'btn btn--outline', back: '/' }));
    if (item.state === 'approved_scheduled') btns.push(acts.includes('publish') ? form(item, 'publish', csrf, '발행', { back: '/?tab=scheduled' }) : '<span class="muted">발행 시각 전</span>');
  }
  return `<article class="q-card${item.state === 'outline_pending' ? ' q-card--focus' : ''}">
    <div class="q-card__head"><span class="muted">${esc(KIND_LABEL[item.kind])} · ${stage(item)}</span><span class="badge-s ${BADGE[item.state]}">${esc(STATE_LABEL[item.state])}</span></div>
    <h3><a href="/?id=${esc(item.id)}">${esc(itemTitle(item))}</a></h3>
    <p class="muted">${esc(summaryLine(item))}</p>
    <div class="q-card__btns">${btns.join('')}</div>
  </article>`;
}

/** 선택 항목 상세: 개요 미리보기·수정 / 검사 결과 / 승인·예약 / 기록 */
export function detail(item, { csrf, now, md, message }) {
  const acts = allowedActions(item, now);
  const out = [];
  out.push(`<section class="panel" id="detail"><h2>${stage(item) === '개요' ? '개요 미리보기' : '본문'} · ${esc(itemTitle(item))}</h2>`);

  if (item.outline) {
    out.push(`<dl class="kv"><dt>제목안</dt><dd>${item.outline.titles.map((t, i) => `${'①②③④⑤'[i] || i + 1} ${esc(t)}`).join('<br>')}</dd>
      <dt>목차</dt><dd>${item.outline.toc.map((t, i) => `${i + 1} ${esc(t)}`).join(' → ')}</dd>
      <dt>출처</dt><dd>${item.outline.sourceIds.map((s) => `[${esc(s)}]`).join(' ')}</dd>
      ${item.requestNote ? `<dt>요청 메모</dt><dd>${esc(item.requestNote)}</dd>` : ''}</dl>`);
  }

  if (acts.includes('outline_save')) {
    const o = item.outline;
    out.push(`<form method="post" action="/item/${esc(item.id)}/outline_save" class="stack" id="edit">
      <input type="hidden" name="csrf" value="${esc(csrf)}">
      <label>제목안 (줄마다 1개)<textarea name="titles" rows="3">${esc(o.titles.join('\n'))}</textarea></label>
      <label>목차 (줄마다 1개)<textarea name="toc" rows="4">${esc(o.toc.join('\n'))}</textarea></label>
      <label>출처 ID (줄마다 1개)<textarea name="sourceIds" rows="3">${esc(o.sourceIds.join('\n'))}</textarea></label>
      <button class="btn btn--outline" type="submit">개요 수정 저장</button></form>`);
    out.push(`<form method="post" action="/item/${esc(item.id)}/outline_approve" class="stack" id="approve">
      <input type="hidden" name="csrf" value="${esc(csrf)}">
      <fieldset><legend>사용할 제목</legend>${o.titles.map((t, i) => `<label class="radio"><input type="radio" name="title" value="${esc(t)}"${i === 0 ? ' checked' : ''}> ${esc(t)}</label>`).join('')}</fieldset>
      <button class="btn btn--primary" type="submit">개요 승인 → 본문 생성</button></form>`);
    out.push(form(item, 'outline_reject', csrf, '개요 반려(재작성 요청)', { cls: 'btn btn--outline', fields: '<input name="note" placeholder="요청 메모" aria-label="요청 메모">' }));
  }

  if (item.check) {
    const c = item.check;
    out.push(`<h3>검사 결과 <span class="badge-s ${c.verdict === 'block' ? 'b-red' : c.verdict === 'warn' ? 'b-yellow' : 'b-green'}">${c.verdict === 'block' ? '차단 · 발행 불가' : c.verdict === 'warn' ? '2군 경고' : '금지어·근거 통과'}</span></h3>`);
    const rows = [...c.slotErrors.map((e) => `<li><span class="badge-s b-red">슬롯</span> ${esc(e)}</li>`),
      ...c.findings.map((f) => `<li><span class="badge-s ${f.tier === '1' || f.tier === 'required' ? 'b-red' : f.tier === 'evidence' ? 'b-orange' : 'b-yellow'}">${TIER[f.tier]}</span> <strong>${esc(f.word || f.sourceId || f.rule || f.match)}</strong> <span class="muted">${f.location ? `${f.location.line}줄 · 문단 ${f.location.paragraph}` : ''}</span>${f.sentence ? `<br><span>${esc(f.sentence)}</span>` : ''}</li>`)];
    out.push(rows.length ? `<ul class="findings">${rows.join('')}</ul>` : '<p class="muted">검출 없음</p>');
    out.push(`<p class="muted">필터 ${esc(c.filterVersion)} · 검사 ${fmt(c.checkedAt)}</p>`);
    if (md !== null) out.push(`<p><a class="text-link" href="/preview/${esc(item.id)}" target="_blank" rel="noopener">고객 화면 그대로 미리보기 ↗</a></p>`);
  }

  if (acts.includes('approve')) {
    const warned = item.state === 'warned';
    out.push(`<form method="post" action="/item/${esc(item.id)}/approve" class="stack" id="approve">
      <input type="hidden" name="csrf" value="${esc(csrf)}">
      <label>발행 시각(이 시각 이후 '발행' 버튼이 열립니다)<input type="datetime-local" name="publishAt" value="${esc(localInput(defaultPublishAt(now)))}" required></label>
      ${warned ? '<label>2군 경고 통과 사유 (필수 · 로그에 남습니다)<input name="reason" required></label>' : ''}
      <button class="btn btn--primary" type="submit">승인 · 예약</button></form>`);
  }
  if (acts.includes('request_revision')) {
    out.push(form(item, 'request_revision', csrf, '수정 요청 → 재작성 큐', { cls: 'btn btn--outline', fields: '<input name="note" placeholder="요청 메모" aria-label="요청 메모">' }));
  }
  if (item.state === 'blocked') out.push('<p class="notice">1군·근거·슬롯 위반 항목에는 승인 버튼이 없습니다. 운영자가 임의로 우회할 수 없습니다.</p>');
  if (item.state === 'approved_scheduled') {
    out.push(acts.includes('publish') ? form(item, 'publish', csrf, '발행', { back: '/?tab=scheduled' }) : `<p class="muted">발행 시각(${fmt(item.schedule.publishAt)}) 전에는 발행 버튼이 열리지 않습니다. 자동 발행은 없습니다.</p>`);
  }
  if (message) {
    out.push(`<h3>채널 메시지 (SB-10 · 발송은 카카오 채널 관리자에서)</h3><textarea id="msg" rows="7" readonly>${esc(message)}</textarea>
      <button class="btn btn--outline" type="button" data-copy="msg">메시지 복사</button>`);
  }
  out.push(`<h3>기록</h3><ul class="history">${(item.history || []).map((h) => `<li>${fmt(h.at)} · ${esc(h.by)} · ${esc(h.action)}${h.note ? ` · ${esc(h.note)}` : ''}</li>`).join('')}</ul>`);
  out.push('</section>');
  return out.join('\n');
}

export function layout({ title, body, csrf = null, tab = 'queue', counts = null, msg = null }) {
  const nav = MENU.map(([id, label]) => `<a href="/?tab=${id}" class="nav-item${tab === id ? ' is-on' : ''}">${esc(label)}${id === 'queue' && counts ? ` <span>${counts}</span>` : ''}</a>`).join('');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${esc(title)} · FD 운영</title><link rel="icon" href="data:,">
<link rel="stylesheet" href="/site/assets/base.css"><link rel="stylesheet" href="/static/review.css"></head><body>
<div class="ops-shell">${csrf ? `<nav class="ops-nav" aria-label="운영 메뉴"><p class="ops-brand">FD 운영</p>${nav}
<form method="post" action="/logout"><input type="hidden" name="csrf" value="${esc(csrf)}"><button class="nav-item nav-btn" type="submit">로그아웃</button></form>
<a class="nav-item" href="/m">모바일 간이 뷰</a></nav>` : ''}
<main class="ops-main">${msg ? `<p class="flash" role="status">${esc(msg)}</p>` : ''}${body}</main></div>
<script src="/static/review.js" defer></script></body></html>`;
}

export function loginPage(error) {
  return layout({ title: '로그인', body: `<section class="panel login"><h1>FD 운영 로그인</h1>
  ${error ? `<p class="flash flash--err" role="alert">${esc(error)}</p>` : ''}
  <form method="post" action="/login" class="stack"><label>아이디<input name="user" autocomplete="username" required></label>
  <label>비밀번호<input name="password" type="password" autocomplete="current-password" required></label>
  <button class="btn btn--primary" type="submit">로그인</button></form>
  <p class="muted">Tailscale 내부망 전용 · 계정 1개 · 세션 12시간</p></section>` });
}

export function queuePage({ items, tab, csrf, now, selected, md, message, msg, queueCount }) {
  const heading = { queue: '검토 대기열', scheduled: '발행 예정', published: '발행 완료' }[tab];
  const body = `<div class="ops-top"><h1>${heading}</h1><span class="muted">발행은 운영자 클릭으로만 · 자동 발행 없음</span></div>
  <div class="q-list">${items.length ? items.map((i) => card(i, csrf, now)).join('') : '<p class="muted">항목 없음</p>'}</div>
  ${selected ? detail(selected, { csrf, now, md, message }) : ''}`;
  return layout({ title: heading, body, csrf, tab, counts: queueCount, msg });
}

export function mobilePage({ items, csrf, now, msg }) {
  const cards = items.map((item) => {
    const acts = allowedActions(item, now);
    const back = '<input type="hidden" name="back" value="/m">';
    const b = [];
    if (acts.includes('outline_approve')) {
      b.push(form(item, 'outline_approve', csrf, '승인', { fields: `<input type="hidden" name="title" value="${esc(item.outline.titles[0])}">${back}` }));
      b.push(form(item, 'outline_reject', csrf, '반려', { cls: 'btn btn--outline', fields: back }));
      b.push(`<a class="btn btn--outline" href="/?id=${esc(item.id)}#edit">개요 수정</a>`);
    }
    if (acts.includes('approve')) {
      const reason = item.state === 'warned' ? '<input name="reason" placeholder="2군 통과 사유(필수)" aria-label="통과 사유" required>' : '';
      b.push(form(item, 'approve', csrf, '승인', { fields: `<input type="hidden" name="publishAt" value="${esc(localInput(defaultPublishAt(now)))}">${reason}${back}` }));
    }
    if (acts.includes('request_revision')) b.push(form(item, 'request_revision', csrf, '반려', { cls: 'btn btn--outline', fields: back }));
    return `<article class="m-card"><p><span class="dot ${BADGE[item.state]}"></span> ${esc(stage(item))} · ${esc(itemTitle(item))}</p>
      <p class="muted">${esc(STATE_LABEL[item.state])} · ${esc(summaryLine(item))}</p><div class="m-btns">${b.join('')}</div></article>`;
  }).join('');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>대기열 · FD 운영</title><link rel="icon" href="data:,">
<link rel="stylesheet" href="/site/assets/base.css"><link rel="stylesheet" href="/static/review.css"></head><body class="m-body">
<main class="m-main"><h1>대기열 ${items.length}</h1>${msg ? `<p class="flash" role="status">${esc(msg)}</p>` : ''}${cards || '<p class="muted">항목 없음</p>'}
<p class="muted">모바일 간이 뷰 — 승인 · 반려 · 개요 수정만. 발행은 데스크톱 화면에서.</p><a class="text-link" href="/">전체 화면 →</a></main>
<script src="/static/review.js" defer></script></body></html>`;
}

export function sourcesPage({ sources, csrf, queueCount }) {
  const rows = sources.sources.map((s) => `<tr><td><code>${esc(s.id)}</code></td><td>${esc(s.topic)}</td><td>${esc(s.title)}</td><td>${esc(s.publisher)}</td><td>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">열기 ↗</a>` : '—'}</td><td>${esc(s.checkedAt || '—')}</td></tr>`).join('');
  return layout({ title: '소스 라이브러리', csrf, tab: 'sources', counts: queueCount, body: `<h1>소스 라이브러리</h1><p class="muted">ops/sources/index.json · 에이전트는 이 안의 출처 ID 로만 근거를 붙인다(F4-0).</p>
  <table class="tbl"><thead><tr><th>ID</th><th>주제</th><th>제목</th><th>기관</th><th>URL</th><th>확인일</th></tr></thead><tbody>${rows}</tbody></table>` });
}

export function dictionaryPage({ dict, csrf, queueCount }) {
  const row = (label, words, action) => `<tr><th>${esc(label)}</th><td>${words.map(esc).join(', ')}</td><td>${esc(action)}</td></tr>`;
  return layout({ title: '금지어 사전', csrf, tab: 'dictionary', counts: queueCount, body: `<h1>금지어 사전 <span class="muted">v${esc(dict._meta.version)} · ${esc(dict._meta.updatedAt)}</span></h1>
  <p class="muted">data/forbidden-words.json (읽기 전용 — 변경은 파일 수정 후 커밋)</p>
  <table class="tbl"><tbody>${row('1군', [...dict.tier1_block.words, ...dict.tier1_block.patterns], '차단')}${row('2군', dict.tier2_warn.words, '경고 · 사유 기록 후 통과')}
  ${row('근거', dict.evidence_check.patterns, '출처 ID 없으면 차단')}${row('예외', dict.whitelist.words, '1·2군 검사에서 제외')}${row('어미', dict.ux_writing.forbiddenEndings, '경고')}
  ${row('필수', dict.required.rules.map((r) => r.rule), '미충족 시 차단')}</tbody></table>` });
}

export function logsPage({ logs, csrf, queueCount }) {
  const rows = logs.map((l) => `<tr><td>${fmt(l.at)}</td><td><code>${esc(l.contentId)}</code></td><td>${esc(l.approver)}</td><td>${esc(l.action)}</td><td>${l.filter ? `${esc(l.filter.verdict)} · ${esc(l.filter.version)}` : '—'}</td><td>${esc(l.reason || '')}</td></tr>`).join('');
  return layout({ title: '로그', csrf, tab: 'logs', counts: queueCount, body: `<h1>로그</h1><p class="muted">ops/logs/review.jsonl — 콘텐츠 ID · 시각 · 승인자 · 동작 · 필터 결과</p>
  <table class="tbl"><thead><tr><th>시각</th><th>콘텐츠 ID</th><th>승인자</th><th>동작</th><th>필터</th><th>사유</th></tr></thead><tbody>${rows || '<tr><td colspan="6">기록 없음</td></tr>'}</tbody></table>` });
}
