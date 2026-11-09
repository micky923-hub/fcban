// 내 나이 달력 화면 (SB-02 입력 / SB-03 결과)
// - 입력 → 같은 페이지에서 결과로 전환. 라우팅·서버 호출 없음.
// - 입력값·결과는 이 페이지 메모리에만 있다. localStorage·쿠키·URL 파라미터를 쓰지 않는다.
//   (history.state 에는 화면 이름만 넣는다 — 날짜는 넣지 않는다)
import { copy, h, mountPage, disclaimer, otherToolsLink, shareButton, setFieldError, bottomSheet, sitePath, LABELS } from '../assets/ui.js';
import rules from '../assets/ageRules.data.js';
import { ageCalendar, isValidISO, toISO, fill } from '../assets/ageCalendar.js';

const C = copy.calendar;
const R = C.result;

/** 국민연금 조건 안내(copy.disclaimer.pension) 표시 — Q1 A안 결정(화이트리스트 추가)으로 켬 */
const SHOW_PENSION_NOTICE = true;

// ── 날짜 유틸(화면용) ──────────────────────────────────────────

/** 브라우저 로컬 날짜(오늘)를 'YYYY-MM-DD' 로. Date 는 여기서 '오늘'을 얻을 때만 쓴다 */
function todayISO() {
  const d = new Date();
  return toISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
const dotted = (iso) => iso.replaceAll('-', '.');
const digitsOf = (s) => String(s).replace(/\D/g, '').slice(0, 8);
const digitsToISO = (d) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;

/** 숫자만 받아 'YYYY.MM.DD' 로 점진 포맷 */
function formatDigits(d) {
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}.${d.slice(4)}`;
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6)}`;
}

function attachDateMask(input) {
  input.addEventListener('input', () => {
    const f = formatDigits(digitsOf(input.value));
    if (f !== input.value) input.value = f;
  });
}

/** 생년월일 검사 → 오류 문구 또는 null */
function validateBirth(iso, digits, today) {
  if (digits.length !== 8 || !isValidISO(iso)) return C.errors.invalidFormat;
  if (iso < rules.input.minBirthISO) return C.errors.tooOld;
  if (iso > today) return C.errors.futureDate;
  return null;
}

// ── 화면 ───────────────────────────────────────────────────────

const main = mountPage(document.getElementById('app'), { title: C.title });
const state = { birthISO: null, baseISO: null, baseOpen: false };

// 입력 화면 (SB-02)
const birthInput = h('input', {
  id: 'birth', class: 'field__input', type: 'text', inputmode: 'numeric', autocomplete: 'off',
  maxlength: '10', placeholder: C.birthPlaceholder, 'aria-describedby': 'birth-error',
});
const birthError = h('p', { id: 'birth-error', class: 'field__error', 'aria-live': 'polite' });
attachDateMask(birthInput);

const baseInput = h('input', {
  id: 'base', class: 'field__input', type: 'text', inputmode: 'numeric', autocomplete: 'off',
  maxlength: '10', 'aria-describedby': 'base-error',
});
const baseError = h('p', { id: 'base-error', class: 'field__error', 'aria-live': 'polite' });
attachDateMask(baseInput);

const todayText = h('span');
const baseToggle = h('button', { type: 'button', class: 'text-link', 'aria-expanded': 'false', 'aria-controls': 'base', text: `${C.baseToggle} →` });
const baseStatic = h('div', { class: 'field__static' },
  h('span', { class: 'cal-base__today' }, h('span', { text: LABELS.today }), todayText), baseToggle);
baseInput.hidden = true;

function setBaseOpen(open) {
  state.baseOpen = open;
  baseStatic.hidden = open;
  baseInput.hidden = !open;
  baseToggle.setAttribute('aria-expanded', String(open));
  if (open) {
    if (!baseInput.value) baseInput.value = dotted(todayISO());
    baseInput.focus();
  } else {
    baseInput.value = '';
    setFieldError(baseInput, baseError, null);
  }
}
baseToggle.addEventListener('click', () => setBaseOpen(true));

const form = h('form', { class: 'cal-form', novalidate: true },
  h('div', { class: 'field' },
    h('label', { class: 'field__label', for: 'birth', text: C.birthLabel }), birthInput, birthError),
  h('div', { class: 'field' },
    h('label', { class: 'field__label', for: 'base', text: C.baseLabel }), baseStatic, baseInput, baseError),
  h('button', { type: 'submit', class: 'btn btn--primary btn--block', text: C.submit }));

const inputView = h('section', { 'aria-labelledby': 'cal-title' },
  h('div', { style: 'display:flex;flex-direction:column;gap:var(--sp-5)' },
    h('div', {},
      h('h1', { class: 'page-title', id: 'cal-title', text: C.headline }),
      h('p', { class: 'page-sub', text: C.sub })),
    form,
    h('section', { class: 'card', 'aria-labelledby': 'what-title' },
      h('h2', { class: 'card__title', id: 'what-title', text: C.whatLabel }),
      h('ul', { class: 'bullets' }, C.whatItems.map((t) => h('li', { text: t }))))));

// 결과 화면 (SB-03)
const resultView = h('section', { 'aria-labelledby': 'result-heading', hidden: true });
// SB-06 순서: 고지문 → 공유 → 다른 도구 보기. 공유·다시 만들기는 결과 상태에서만 보인다.
const resultActions = h('div', { class: 'btn-row', hidden: true },
  shareButton({ text: C.share, path: 'calendar/' }),
  h('button', { type: 'button', class: 'btn btn--outline', text: R.again, onclick: () => restart() }));
const sheet = bottomSheet({ id: 'ins-info', title: LABELS.insuranceAgeTitle, body: R.insuranceAgeInfo });

main.append(inputView, resultView, disclaimer('general'), resultActions, otherToolsLink(), sheet);

function openSheet() {
  if (typeof sheet.showModal === 'function') sheet.showModal();
  else sheet.setAttribute('open', ''); // <dialog> 미지원 구형 브라우저
}

function refreshToday() { todayText.textContent = dotted(todayISO()); }
refreshToday();

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const today = todayISO();
  const bDigits = digitsOf(birthInput.value);
  const bISO = digitsToISO(bDigits);
  const bErr = validateBirth(bISO, bDigits, today);
  setFieldError(birthInput, birthError, bErr);

  let baseISO = today;
  let baseErr = null;
  if (state.baseOpen) {
    const d = digitsOf(baseInput.value);
    baseISO = digitsToISO(d);
    if (d.length !== 8 || !isValidISO(baseISO) || baseISO < rules.input.minBirthISO) baseErr = C.errors.invalidFormat;
    else if (!bErr && baseISO < bISO) baseErr = C.errors.invalidFormat; // 기준일 < 생년월일 — 전용 문구 없음(Q3)
  }
  setFieldError(baseInput, baseError, baseErr);

  if (bErr) return birthInput.focus();
  if (baseErr) return baseInput.focus();
  state.birthISO = bISO;
  state.baseISO = baseISO;
  showResult(true);
});

function showInput({ reset = false, focus = true } = {}) {
  if (reset) {
    birthInput.value = '';
    setBaseOpen(false);
    state.birthISO = state.baseISO = null;
  }
  refreshToday();
  resultView.hidden = true;
  resultActions.hidden = true;
  resultView.replaceChildren();
  inputView.hidden = false;
  window.scrollTo(0, 0);
  if (focus) birthInput.focus();
}

function showResult(push) {
  const res = ageCalendar(state.birthISO, state.baseISO, rules, { rowCopy: R.rows, parityWords: LABELS.parity });
  resultView.replaceChildren(...renderResult(res));
  inputView.hidden = true;
  resultView.hidden = false;
  resultActions.hidden = false;
  // 뒤로가기 시 입력 화면 복원. URL 은 그대로, state 에는 화면 이름만.
  if (push) history.pushState({ view: 'result' }, '');
  window.scrollTo(0, 0);
  document.getElementById('result-heading').focus();
}

let resetOnPop = false;
window.addEventListener('popstate', () => {
  const reset = resetOnPop;
  resetOnPop = false;
  if (inputView.hidden) showInput({ reset });
});
// 새로고침·재방문 시에는 입력 화면부터(결과를 복원하지 않는다)
if (history.state && history.state.view) history.replaceState(null, '');

const onResultEntry = () => Boolean(history.state && history.state.view === 'result');

/** 수정: 값 유지한 채 입력 화면으로 */
function editInput() {
  if (onResultEntry()) history.back(); // popstate 가 입력 화면을 연다
  else showInput();
}

/** 다시 만들기: 값을 지우고 입력 화면으로 */
function restart() {
  if (onResultEntry()) { resetOnPop = true; history.back(); }
  else showInput({ reset: true });
}

const INFO_ICON = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 9v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="10" cy="6.2" r="1.1" fill="currentColor"/></svg>';

function rowDateLabel(row) {
  if (row.key === 'checkupThisYear') return `${LABELS.thisYear} ${row.year}`;
  if (row.key === 'checkupNext') return String(row.year);
  if (row.key === 'pensionStart') return row.month.replace('-', '.');
  return dotted(row.date);
}

function rowSub(row) {
  const sub = h('p', { class: 'timeline__sub' });
  // '… · 암검진 항목은 건강 체크 →' 의 화살표 구간은 건강 체크로 가는 링크
  if (row.key === 'checkupNext' && row.sub.endsWith('→')) {
    const parts = row.sub.split(' · ');
    const linkText = parts.pop();
    sub.append(parts.length ? `${parts.join(' · ')} · ` : '', h('a', { href: sitePath('health/'), text: linkText }));
  } else {
    sub.textContent = row.sub;
  }
  return sub;
}

function renderResult(res) {
  const isBirthdayToday = res.daysToBirthday === 0;
  const summary = h('div', { class: 'cal-summary' },
    h('p', { text: `${dotted(state.birthISO)} ${LABELS.birthSuffix} · ${LABELS.baseDate} ${dotted(state.baseISO)}` }),
    h('button', { type: 'button', class: 'text-link', text: R.edit, onclick: editInput }));

  const ageCard = h('section', { class: 'card age-card', 'aria-label': R.fullAge },
    h('div', {},
      h('p', { class: 'age-card__label', text: R.fullAge }),
      h('p', { class: 'age-card__figure' }, String(res.fullAge), h('span', { class: 'age-card__unit', text: LABELS.ageUnit }))),
    h('div', { class: 'age-card__next' },
      h('p', {}, `${R.nextBirthday} `, h('strong', { text: dotted(res.nextBirthday) })),
      h('span', { class: 'badge', text: isBirthdayToday ? R.todayIsBirthday : fill(LABELS.dday, { days: res.daysToBirthday }) })));

  const timeline = h('ol', { class: 'timeline' }, res.rows.map((row) => {
    const title = h('h3', { class: 'timeline__title' }, h('span', { text: row.title }));
    if (row.info) {
      const btn = h('button', { type: 'button', class: 'info-btn', 'aria-label': LABELS.infoAria, 'aria-haspopup': 'dialog', onclick: openSheet });
      btn.innerHTML = INFO_ICON; // 고정 SVG 상수(사용자 입력 아님)
      title.append(btn);
    }
    return h('li', { class: `timeline__item${row.highlight ? ' timeline__item--hl' : ''}` },
      h('p', { class: 'timeline__date', text: rowDateLabel(row) }), title, rowSub(row));
  }));

  return [
    h('h2', { class: 'sr-only result-heading', id: 'result-heading', tabindex: '-1', text: `${C.title} ${LABELS.resultHeading}` }),
    h('div', { style: 'display:flex;flex-direction:column;gap:var(--sp-5)' },
      summary, ageCard, timeline,
      SHOW_PENSION_NOTICE ? h('p', { class: 'notice', text: copy.disclaimer.pension }) : null),
  ];
}
