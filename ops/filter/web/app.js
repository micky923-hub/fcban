// 금지어·근거 검사 웹 화면 — 검사는 이 브라우저 안에서만 한다(원고를 서버로 보내지 않는다).
import { checkText } from '/core.mjs';

const load = (p) => fetch(p, { cache: 'no-store' }).then((r) => r.json()); // 같은 로컬 서버의 정적 사전 파일만 읽는다
const [dict, sources, copy] = await Promise.all([load('/data/forbidden-words.json'), load('/data/sources-index.json'), load('/data/copy.ko.json')]);
const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

$('meta').textContent = `필터 사전 v${dict._meta.version} · ${dict._meta.updatedAt} · 소스 라이브러리 ${sources.sources.length}건`;

const TIER_LABEL = { 1: '1군', 2: '2군', evidence: '근거', ending: '어미', required: '필수' };
const VERDICT = { block: ['차단 · 발행 불가', 'verdict--block'], warn: ['경고 · 사유 입력 후 통과', 'verdict--warn'], pass: ['통과', 'verdict--pass'] };
const REQ = { source: ['출처', '출처 링크·ID 1개 이상'], disclaimer: ['고지문', copy.disclaimer.general.slice(0, 12) + '… / ' + copy.disclaimer.tax.slice(0, 10) + '…'], byline: ['바이라인', copy.brand.byline], noFear: ['결론', "'대비·준비' 권유로 끝나지 않음"] };

function title(f) {
  if (f.tier === 'evidence' && f.sourceId) return `'${f.sourceId}' 소스 라이브러리에 없음`;
  if (f.tier === 'evidence') return `'${f.match}' 출처 ID 없음`;
  if (f.tier === 'required') return `${f.rule} 미충족`;
  return f.word || f.match;
}

function render(text, r) {
  const v = $('verdict');
  v.hidden = false;
  v.textContent = VERDICT[r.verdict][0];
  v.className = `verdict ${VERDICT[r.verdict][1]}`;

  // 하이라이트: 겹치지 않게 앞에서부터
  const pv = $('preview');
  pv.replaceChildren();
  let at = 0;
  for (const f of r.findings.filter((x) => x.end > x.start).sort((a, b) => a.start - b.start)) {
    if (f.start < at) continue;
    pv.append(text.slice(at, f.start));
    const m = el('mark', `t${f.tier}`, text.slice(f.start, f.end));
    m.title = `${TIER_LABEL[f.tier]} · ${title(f)}`;
    pv.append(m);
    at = f.end;
  }
  pv.append(text.slice(at));

  const list = $('findings');
  list.replaceChildren();
  for (const f of r.findings) {
    const card = el('div', 'finding');
    card.append(el('span', `chip-t chip-t--${f.tier}`, TIER_LABEL[f.tier]));
    const main = el('div', 'finding__main');
    main.append(el('strong', '', title(f)), el('span', 'finding__loc', `${f.location.line}줄 ${f.location.col}칸 · 문단 ${f.location.paragraph}`));
    if (f.sentence) main.append(el('span', '', f.sentence));
    card.append(main);
    list.append(card);
  }
  if (r.required) {
    for (const [k, ok] of Object.entries(r.required)) {
      if (!ok) continue;
      const card = el('div', 'finding');
      card.append(el('span', 'chip-t chip-t--ok', REQ[k][0]));
      const main = el('div', 'finding__main');
      main.append(el('strong', '', '확인됨'), el('span', 'finding__loc', REQ[k][1]));
      card.append(main);
      list.append(card);
    }
  }
  if (!r.findings.length && !r.required) list.append(el('p', 'meta', '검출 없음'));
}

function run() {
  const text = $('text').value;
  const mode = document.querySelector('input[name=mode]:checked').value;
  render(text, checkText(text, { dict, sources, copy, mode, endingExceptions: [copy.hub.hero] }));
}
$('run').addEventListener('click', run);
$('text').addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') run(); });
