// 허브 (SB-01): 이번 주 다이어리 → 올해 알아둘 숫자 → 도구 3개 → 만든 사람 → 채널 추가.
// 실행 중 서버 요청 없음 — 주간 글은 index.html 에 빌드 때 심은 JSON 을 읽는다. 공유 버튼 없음.
import { copy, config, h, mountPage, channelButton, sitePath, LABELS } from './assets/ui.js';
import { hubModel } from './assets/hub.js';
import ageRules from './assets/ageRules.data.js';
import taxRules from './assets/taxRules.data.js';

/** 도구 아이콘(장식용 고정 SVG — 사용자 입력이 들어가지 않는다) */
const ICONS = {
  health: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M8 11h2l1-2 2 4 1-2h2"/>',
  estate: '<path d="M4 11l8-6 8 6"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/><path d="M8 14h2M14 14h2M8 17h2"/>',
};
function icon(id) {
  const span = h('span', { class: 'tool__icon', 'aria-hidden': 'true' });
  span.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[id] || ''}</svg>`;
  return span;
}

function readWeekly() {
  const el = document.getElementById('weekly-data');
  const text = el && el.textContent.trim();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

const m = hubModel(copy, readWeekly(), {
  year: new Date().getFullYear(), // 브라우저 로컬 날짜의 연도
  ageRules, taxRules, parityWords: LABELS.parity, channelUrl: config.KAKAO_CHANNEL_URL,
});
const main = mountPage(document.getElementById('app'), {});

const hero = h('section', { 'aria-labelledby': 'hub-title' },
  h('h1', { class: 'hub-hero__title', id: 'hub-title', text: m.hero }),
  h('p', { class: 'page-sub', text: m.sub }));

const weekly = m.weekly && h('section', { class: 'hub-section', 'aria-labelledby': 'weekly-label' },
  h('div', { class: 'hub-section__head' },
    h('h2', { class: 'hub-section__title', id: 'weekly-label', text: m.weekly.label }),
    m.weekly.dateLabel && h('span', { class: 'hub-section__meta', text: m.weekly.dateLabel })),
  h('a', { class: 'card weekly', href: sitePath(m.weekly.path) },
    h('h3', { class: 'weekly__title', text: m.weekly.title }),
    h('p', { class: 'weekly__dongui', text: m.weekly.dongui }),
    h('span', { class: 'weekly__more', text: m.weekly.readMore })));

const tools = h('section', { class: 'hub-section', 'aria-labelledby': 'tools-label' },
  h('h2', { class: 'hub-section__title', id: 'tools-label', text: m.toolsLabel }),
  h('ul', { class: 'tools' }, m.tools.map((t) => h('li', {},
    h('a', { class: 'tool', href: sitePath(t.path) },
      icon(t.id),
      h('span', { class: 'tool__text' },
        h('span', { class: 'tool__title', text: t.title }),
        h('span', { class: 'tool__sub', text: t.sub })),
      h('span', { class: 'tool__arrow', 'aria-hidden': 'true', text: '→' }))))));

const numbers = m.numbers && h('section', { class: 'hub-section', 'aria-labelledby': 'numbers-label' },
  h('h2', { class: 'hub-section__title', id: 'numbers-label', text: m.numbers.label }),
  h('ul', { class: 'numbers' }, m.numbers.cards.map((c) => h('li', {},
    h('a', { class: 'number', href: sitePath(c.path) },
      h('span', { class: 'number__title', text: c.title }),
      h('strong', { class: 'number__figure', text: c.figure }),
      h('span', { class: 'number__sub', text: c.sub }))))),
  m.numbers.note && h('p', { class: 'hub-note', text: m.numbers.note }));

const op = m.operator;
const operator = op && h('section', { class: 'hub-section', 'aria-labelledby': 'operator-label' },
  h('h2', { class: 'hub-section__title', id: 'operator-label', text: op.label }),
  h('div', { class: 'operator' },
    h('div', { class: 'operator__head' },
      h('span', { class: 'operator__avatar', 'aria-hidden': 'true', text: op.name.trim().split(/\s+/).pop().charAt(0) }), // 바이라인 끝 이름의 첫 글자
      h('span', { class: 'operator__name', text: op.name })),
    h('p', { class: 'operator__text', text: op.text }),
    op.chat && h('a', { class: 'operator__chat', href: op.chat.url, target: '_blank', rel: 'noopener', text: op.chat.label })));

main.append(hero, weekly || '', numbers || '', tools, operator || '', channelButton({ block: true }));
