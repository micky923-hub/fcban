// 내 나이 건강 체크 화면 (SB-05 선택 / SB-06 결과)
// - 입력은 나이대·성별 두 범주값뿐. 서버 전송 없음, 결과는 정적 JSON 12세트에서 조회.
// - 내 나이 달력에서 넘어온 경우 나이대 자동 선택(assets/handoff.js, 1회용 세션 메모리).
import { copy, h, mountPage, disclaimer, otherToolsLink, shareButton, bottomSheet, sitePath, LABELS } from '../assets/ui.js';
import data from '../assets/healthData.data.js';
import { healthModel, isDraftSet } from '../assets/health.js';
import { takeAgeGroupHandoff } from '../assets/handoff.js';

const C = copy.health;
const main = mountPage(document.getElementById('app'), { title: C.title });
const draftBadge = () => (isDraftSet(data, null) ? h('span', { class: 'badge badge--draft', text: LABELS.draft }) : null);

// ── 선택 화면 (SB-05) ─────────────────────────────────────────

function chipGroup(name, legend, options) {
  const inputs = [];
  const fs = h('fieldset', { class: 'chips' },
    h('legend', { class: 'field__label', text: legend }),
    h('div', { class: `chips__grid chips__grid--${options.length > 2 ? 3 : 2}` },
      options.map((o) => {
        const input = h('input', { type: 'radio', name, value: o.id, class: 'chip__input', id: `${name}-${o.id}` });
        inputs.push(input);
        return h('label', { class: 'chip', for: `${name}-${o.id}` }, input, h('span', { class: 'chip__face', text: o.label }));
      })));
  return { fs, inputs, value: () => inputs.find((i) => i.checked)?.value || null };
}

// 칩 라벨은 확정 카피(copy.health.ageOptions / sexOptions)를 쓰고, ID 는 healthData 순서로 맞춘다.
const ages = chipGroup('age', C.ageLabel, data.ageGroups.map((g, i) => ({ id: g.id, label: C.ageOptions[i] })));
const sexes = chipGroup('sex', C.sexLabel, data.sexes.map((s, i) => ({ id: s.id, label: C.sexOptions[i] })));
const submit = h('button', { type: 'submit', class: 'btn btn--primary btn--block', disabled: true, text: C.submit });
const syncSubmit = () => { submit.disabled = !(ages.value() && sexes.value()); };
[...ages.inputs, ...sexes.inputs].forEach((i) => i.addEventListener('change', syncSubmit));

const handed = takeAgeGroupHandoff(data.ageGroups.map((g) => g.id));
if (handed) ages.inputs.find((i) => i.value === handed).checked = true;

const sourceCard = () => h('section', { class: 'card', 'aria-label': C.sourceLabel },
  h('div', { class: 'hc-title-row' }, h('h2', { class: 'card__title', text: C.sourceLabel }), draftBadge()),
  h('p', { class: 'hc-source__text', text: C.sourceText }));

const form = h('form', { class: 'hc-form', novalidate: true }, ages.fs, sexes.fs, submit);
const inputView = h('section', { 'aria-labelledby': 'hc-title' },
  h('div', { style: 'display:flex;flex-direction:column;gap:var(--sp-5)' },
    h('div', {},
      h('h1', { class: 'page-title', id: 'hc-title', text: C.headline }),
      h('p', { class: 'page-sub', text: C.sub })),
    form, sourceCard()));

// ── 결과 화면 (SB-06) ─────────────────────────────────────────

const resultView = h('section', { 'aria-labelledby': 'hc-result-heading', hidden: true });
const resultActions = h('div', { class: 'btn-row', hidden: true },
  shareButton({ text: C.share, path: 'health/' }),
  h('a', { class: 'btn btn--outline', href: sitePath('calendar/'), text: C.result.crossLink }));
const sheets = {};
for (const [id, info] of Object.entries(data.info)) {
  sheets[id] = bottomSheet({ id: `info-${id}`, title: info.title, body: info.text });
}
main.append(inputView, resultView, disclaimer('general'), resultActions, otherToolsLink(), ...Object.values(sheets));

const INFO_ICON = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 9v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="10" cy="6.2" r="1.1" fill="currentColor"/></svg>';
function infoButton(infoId, label) {
  const dlg = sheets[infoId];
  const btn = h('button', { type: 'button', class: 'info-btn', 'aria-label': `${label} ${LABELS.infoAria}`, 'aria-haspopup': 'dialog',
    onclick: () => (typeof dlg.showModal === 'function' ? dlg.showModal() : dlg.setAttribute('open', '')) });
  btn.innerHTML = INFO_ICON; // 고정 SVG 상수
  return btn;
}

function renderResult(m) {
  const infoIdOf = (info) => Object.keys(data.info).find((k) => data.info[k] === info);
  return [
    h('h2', { class: 'sr-only result-heading', id: 'hc-result-heading', tabindex: '-1', text: `${C.title} ${LABELS.resultHeading}` }),
    h('div', { style: 'display:flex;flex-direction:column;gap:var(--sp-5)' },
      h('div', { class: 'cal-summary' },
        h('div', { class: 'hc-title-row' }, h('p', { text: m.summary }), m.draft ? h('span', { class: 'badge badge--draft', text: LABELS.draft }) : null),
        h('button', { type: 'button', class: 'text-link', text: C.result.reselect, onclick: reselect })),
      h('section', { class: 'hc-section' },
        h('h3', { class: 'hc-section__title', text: m.general.title }),
        h('ul', { class: 'hc-checks' }, m.general.items.map((t) => h('li', { text: t })))),
      h('section', { class: 'hc-section' },
        h('h3', { class: 'hc-section__title', text: m.cancer.title }),
        m.cancer.items.length
          ? h('ul', { class: 'hc-cancer' }, m.cancer.items.map((c) => h('li', {},
              h('span', { class: 'hc-cancer__name', text: c.name }),
              h('span', { class: 'hc-cancer__detail', text: c.detail }),
              c.info ? infoButton(infoIdOf(c.info), c.info.title) : null)))
          : h('p', { class: 'hc-empty', text: LABELS.noCancerScreening })),
      m.common.items.length ? h('section', { class: 'card hc-common', 'aria-labelledby': 'hc-common-title' },
        h('h3', { class: 'card__title', id: 'hc-common-title', text: m.common.title }),
        h('ul', { class: 'bullets' }, m.common.items.map((t) => h('li', { text: t })))) : null,
      sourceCard()),
  ];
}

// ── 전환 ───────────────────────────────────────────────────────

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const m = healthModel(data, copy, ages.value(), sexes.value());
  if (!m) return;
  resultView.replaceChildren(...renderResult(m));
  inputView.hidden = true;
  resultView.hidden = false;
  resultActions.hidden = false;
  history.pushState({ view: 'result' }, '');
  window.scrollTo(0, 0);
  document.getElementById('hc-result-heading').focus();
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

/** 다시 선택: 선택값 유지한 채 선택 화면으로 */
function reselect() {
  if (history.state && history.state.view === 'result') history.back();
  else showInput();
}
