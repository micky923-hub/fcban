// 상속·증여 간이 계산 화면 (SB-07 입력 / SB-08 결과)
// - 입력 → 같은 페이지 결과 전환. 서버 호출·저장 없음. 결과는 화면에만 있다.
// - 세율·공제는 assets/taxRules.data.js(= data/taxRules.json)에서만 읽는다.
import { copy, h, mountPage, otherToolsLink, shareButton, setFieldError, fill, LABELS } from '../assets/ui.js';
import rules from '../assets/taxRules.data.js';
import { estateEstimate, estimateRange, roundDisplay, formatKRW, parseEok, parseCount } from '../assets/estate.js';

const E = copy.estate;
const L = LABELS.estate;
const won = (n) => fill(L.won, { v: formatKRW(n) });
const approx = (s) => fill(L.approx, { v: s });

const main = mountPage(document.getElementById('app'), { title: E.title });
const state = { tab: 'inheritance' };

// ── 공통 입력 부품 ─────────────────────────────────────────────

function textField({ id, label, placeholder, inputmode, value = '' }) {
  const input = h('input', { id, class: 'field__input', type: 'text', inputmode, autocomplete: 'off', placeholder, value, 'aria-describedby': `${id}-error` });
  const error = h('p', { id: `${id}-error`, class: 'field__error', 'aria-live': 'polite' });
  const el = h('div', { class: 'field' }, h('label', { class: 'field__label', for: id, text: label }), input, error);
  return { el, input, error };
}

function chipGroup(name, legend, options, cols) {
  const inputs = options.map((o) => h('input', { type: 'radio', name, value: o.id, class: 'chip__input', id: `${name}-${o.id}` }));
  const el = h('fieldset', { class: 'chips' },
    legend ? h('legend', { class: 'field__label', text: legend }) : null,
    h('div', { class: `chips__grid chips__grid--${cols}` },
      options.map((o, i) => h('label', { class: 'chip', for: `${name}-${o.id}` }, inputs[i], h('span', { class: 'chip__face', text: o.label })))));
  return { el, inputs, value: () => inputs.find((i) => i.checked)?.value ?? null };
}

// ── 상속 입력 ─────────────────────────────────────────────────

const inh = {
  amount: textField({ id: 'inh-amount', label: E.amountLabelInherit, placeholder: E.amountPlaceholder, inputmode: 'decimal' }),
  spouse: chipGroup('spouse', E.heirsLabel, [{ id: 'yes', label: E.spouseOptions[0] }, { id: 'no', label: E.spouseOptions[1] }], 2),
  children: textField({ id: 'inh-children', label: E.childrenLabel, inputmode: 'numeric', value: '0' }),
  minors: textField({ id: 'inh-minors', label: E.minorsLabel, inputmode: 'numeric', value: '0' }),
};

// ── 증여 입력 ─────────────────────────────────────────────────

const RELATIONS = ['spouse', 'linealDescendant_adult', 'linealDescendant_minor', 'otherRelative']; // copy.estate.relationOptions 순서
const gift = {
  amount: textField({ id: 'gift-amount', label: E.amountLabelGift, placeholder: E.amountPlaceholder, inputmode: 'decimal' }),
  relation: chipGroup('relation', E.relationLabel, RELATIONS.map((id, i) => ({ id, label: E.relationOptions[i] })), 2),
  marriage: h('input', { type: 'checkbox', id: 'gift-marriage' }),
};
const marriageRow = h('label', { class: 'check', for: 'gift-marriage', hidden: true }, gift.marriage, h('span', { text: E.marriageBirthLabel }));

// ── 검사 ───────────────────────────────────────────────────────

/** 현재 탭의 입력 → { input, errors } (input 은 모두 유효할 때만) */
function readForm() {
  const ir = rules.input;
  const errors = new Map();
  if (state.tab === 'inheritance') {
    const asset = parseEok(inh.amount.input.value, ir);
    const children = parseCount(inh.children.input.value, ir.childrenMax);
    const minors = parseCount(inh.minors.input.value, ir.childrenMax);
    const spouse = inh.spouse.value();
    if (asset === null) errors.set(inh.amount, L.amountError);
    if (children === null) errors.set(inh.children, fill(L.countError, { max: ir.childrenMax }));
    if (minors === null) errors.set(inh.minors, fill(L.countError, { max: ir.childrenMax }));
    else if (children !== null && minors > children) errors.set(inh.minors, L.minorsError);
    const ok = !errors.size && spouse !== null;
    return { errors, input: ok ? { kind: 'inheritance', asset, spouse: spouse === 'yes', children, minors } : null };
  }
  const amount = parseEok(gift.amount.input.value, ir);
  const relation = gift.relation.value();
  if (amount === null) errors.set(gift.amount, L.amountError);
  const childRel = relation && relation.startsWith('linealDescendant');
  const ok = !errors.size && relation !== null;
  return { errors, input: ok ? { kind: 'gift', amount, relation, marriageBirth: Boolean(childRel && gift.marriage.checked) } : null };
}

const submit = h('button', { type: 'submit', class: 'btn btn--primary btn--block', disabled: true, text: E.submit });
const touched = new Set();

/** 필수값이 다 맞을 때만 버튼 활성(SB-07 ④). 오류 문구는 손댄 칸에만 */
function sync() {
  const { errors, input } = readForm();
  const fields = state.tab === 'inheritance' ? [inh.amount, inh.children, inh.minors] : [gift.amount];
  for (const f of fields) setFieldError(f.input, f.error, touched.has(f) && f.input.value !== '' ? errors.get(f) : null);
  const rel = gift.relation.value();
  marriageRow.hidden = !(rel && rel.startsWith('linealDescendant'));
  submit.disabled = !input;
}
for (const f of [inh.amount, inh.children, inh.minors, gift.amount]) {
  f.input.addEventListener('input', sync);
  f.input.addEventListener('blur', () => { touched.add(f); sync(); });
}
[...inh.spouse.inputs, ...gift.relation.inputs, gift.marriage].forEach((i) => i.addEventListener('change', sync));

// ── 입력 화면 ─────────────────────────────────────────────────

const headline = h('h1', { class: 'page-title', id: 'es-title' });
const tabButtons = E.tabs.map((label, i) => h('button', {
  type: 'button', role: 'tab', class: 'tab', id: `tab-${i}`, 'aria-controls': 'es-form', text: label,
  onclick: () => setTab(i === 0 ? 'inheritance' : 'gift', true),
}));
const tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': E.title }, tabButtons);
tabs.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  setTab(state.tab === 'inheritance' ? 'gift' : 'inheritance', true);
  tabButtons[state.tab === 'inheritance' ? 0 : 1].focus();
});

const inhFields = h('div', { class: 'es-form' }, inh.amount.el, inh.spouse.el, h('div', { class: 'es-row2' }, inh.children.el, inh.minors.el));
const giftFields = h('div', { class: 'es-form', hidden: true }, gift.amount.el, gift.relation.el, marriageRow);
const form = h('form', { class: 'es-form', id: 'es-form', role: 'tabpanel', novalidate: true }, inhFields, giftFields, submit);

function setTab(tab, userAction) {
  state.tab = tab;
  const inhOn = tab === 'inheritance';
  tabButtons.forEach((b, i) => { b.setAttribute('aria-selected', String(inhOn === (i === 0))); b.tabIndex = inhOn === (i === 0) ? 0 : -1; });
  form.setAttribute('aria-labelledby', inhOn ? 'tab-0' : 'tab-1');
  headline.textContent = inhOn ? E.headlineInherit : E.headlineGift;
  inhFields.hidden = !inhOn;
  giftFields.hidden = inhOn;
  sync();
  if (userAction) (inhOn ? inh.amount : gift.amount).input.focus({ preventScroll: true });
}

const inputView = h('section', { 'aria-labelledby': 'es-title' },
  h('div', { style: 'display:flex;flex-direction:column;gap:var(--sp-5)' }, tabs, headline, form,
    h('p', { class: 'disclaimer', text: copy.disclaimer.tax })));

// ── 결과 화면 ─────────────────────────────────────────────────

const resultView = h('section', { 'aria-labelledby': 'es-result-heading', hidden: true });
const resultActions = h('div', { hidden: true }, shareButton({ text: E.share, path: 'estate/' }));
resultActions.firstChild.classList.add('btn--block');
main.append(inputView, resultView, resultActions, otherToolsLink());
setTab('inheritance', false);

function summaryText(input) {
  if (input.kind === 'inheritance') {
    const parts = [`${E.tabs[0]} ${formatKRW(input.asset)}`, E.spouseOptions[input.spouse ? 0 : 1], fill(L.children, { n: input.children })];
    if (input.minors) parts.push(fill(L.minors, { n: input.minors }));
    return parts.join(' · ');
  }
  const parts = [`${E.tabs[1]} ${formatKRW(input.amount)}`, E.relationOptions[RELATIONS.indexOf(input.relation)]];
  if (input.marriageBirth) parts.push(L.parts.marriageBirth);
  return parts.join(' · ');
}

function bracketRangeText(b) {
  const lo = b.lower === null ? null : `${formatKRW(b.lower)} ${L.over}`;
  const hi = b.upper === null ? null : `${formatKRW(b.upper)} ${L.upTo}`;
  return [lo, hi].filter(Boolean).join(' ~ ');
}

function deductionBreakdown(parts) {
  return parts.map((p) => `${L.parts[p.key]} ${formatKRW(p.amount)}`).join(L.plus);
}

function ratioBar(r) {
  const dedPct = r.zeroTax ? 100 : Math.round((r.deductionTotal / (r.deductionTotal + r.taxableBase)) * 1000) / 10;
  const bar = h('div', { class: 'bar', role: 'img',
    'aria-label': r.zeroTax ? L.barAllDeducted : `${L.barDeduction} ${formatKRW(r.deductionTotal)}, ${L.barTaxable} ${formatKRW(roundDisplay(r.taxableBase, rules))}` },
    h('span', { class: 'bar__ded', style: `width:${dedPct}%` }),
    r.zeroTax ? null : h('span', { class: 'bar__tax', style: `width:${100 - dedPct}%` }));
  const legend = h('div', { class: 'bar__legend', 'aria-hidden': 'true' },
    h('span', { text: r.zeroTax ? L.barAllDeducted : `${L.barDeduction} ${formatKRW(r.deductionTotal)}` }),
    r.zeroTax ? null : h('span', { text: `${L.barTaxable} ${formatKRW(roundDisplay(r.taxableBase, rules))}` }));
  return h('div', { class: 'card es-card--outline' }, bar, legend);
}

function renderResult(input, r) {
  const summary = h('div', { class: 'cal-summary' },
    h('p', { text: summaryText(input) }),
    h('button', { type: 'button', class: 'text-link', text: copy.calendar.result.edit, onclick: editInput }));
  const blocks = [summary];

  if (r.specialCase === 'noChildNoSpouse') {
    blocks.push(h('section', { class: 'card es-card' }, h('p', { class: 'es-zero__sub', text: rules.inheritance.noChildNoSpouseText })));
  } else {
    // ① 공제 합계 — 이 화면의 큰 숫자는 이것 하나
    blocks.push(h('section', { class: 'card es-card', 'aria-label': E.result.deductionTotal },
      h('p', { class: 'es-label', text: E.result.deductionTotal }),
      h('p', { class: 'es-figure', text: won(r.deductionTotal) }),
      h('p', { class: 'es-sub', text: deductionBreakdown(r.deductionParts) })));
    if (r.zeroTax) {
      // 과세표준 ≤ 0 → 숫자 카드 대신 문장 카드
      blocks.push(h('section', { class: 'card es-card es-card--outline' },
        h('p', { class: 'es-zero__title', text: E.result.zeroTax }),
        h('p', { class: 'es-zero__sub', text: fill(E.result.zeroTaxSub, { asset: won(r.total), deduction: won(r.deductionTotal) }) })));
    } else {
      // ② 과세 대상 → ③ 세율 구간 → ④ 예상 세액 범위
      const [low, high] = estimateRange(r.calculatedTax, rules);
      blocks.push(h('section', { class: 'card es-card es-card--outline', 'aria-label': E.result.taxable },
        h('p', { class: 'es-label', text: E.result.taxable }),
        h('p', { class: 'es-mid', text: approx(won(roundDisplay(r.taxableBase, rules))) }),
        h('p', { class: 'es-sub', text: fill(E.result.bracket, { range: bracketRangeText(r.bracket), rate: Math.round(r.bracket.rate * 100) }).replace(/\s{2,}/g, ' ') }),
        h('p', { class: 'es-estimate', text: fill(E.result.estimate, { low: formatKRW(low), high: won(high) }).replace(/\s{2,}/g, ' ') })));
    }
    blocks.push(ratioBar(r));
  }

  const linkLabel = input.kind === 'gift' ? L.giftLink : E.result.externalLink;
  blocks.push(h('a', { class: 'text-link', href: rules.displayRules.externalLink.url, target: '_blank', rel: 'noopener', text: linkLabel }));
  blocks.push(h('p', { class: 'disclaimer', text: copy.disclaimer.taxShort }));

  return [
    h('h2', { class: 'sr-only result-heading', id: 'es-result-heading', tabindex: '-1', text: `${E.title} ${LABELS.resultHeading}` }),
    h('div', { style: 'display:flex;flex-direction:column;gap:var(--sp-4)' }, blocks),
  ];
}

// ── 전환 ───────────────────────────────────────────────────────

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const { input } = readForm();
  if (!input) return;
  const r = estateEstimate(input, rules);
  resultView.replaceChildren(...renderResult(input, r));
  inputView.hidden = true;
  resultView.hidden = false;
  resultActions.hidden = false;
  history.pushState({ view: 'result' }, '');
  window.scrollTo(0, 0);
  document.getElementById('es-result-heading').focus();
});

function showInput() {
  resultView.hidden = true;
  resultActions.hidden = true;
  resultView.replaceChildren();
  inputView.hidden = false;
  window.scrollTo(0, 0);
  submit.focus();
}
window.addEventListener('popstate', () => { if (inputView.hidden) showInput(); });
if (history.state && history.state.view) history.replaceState(null, '');

/** 수정: 값 유지한 채 입력 화면으로 */
function editInput() {
  if (history.state && history.state.view === 'result') history.back();
  else showInput();
}
