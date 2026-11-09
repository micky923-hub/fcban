// 허브 (SB-01): 이번 주 다이어리 → 도구 3개 → 채널 추가.
// 실행 중 서버 요청 없음 — 주간 글은 index.html 에 빌드 때 심은 JSON 을 읽는다. 공유 버튼 없음.
import { copy, h, mountPage, channelButton, sitePath, LABELS } from './assets/ui.js';
import { hubModel } from './assets/hub.js';

function readWeekly() {
  const el = document.getElementById('weekly-data');
  const text = el && el.textContent.trim();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

const m = hubModel(copy, readWeekly(), LABELS);
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
      h('span', { class: 'tool__n', 'aria-hidden': 'true', text: String(t.n) }),
      h('span', { class: 'tool__text' },
        h('span', { class: 'tool__title', text: t.title }),
        h('span', { class: 'tool__sub', text: t.sub })),
      h('span', { class: 'tool__arrow', 'aria-hidden': 'true', text: '→' }))))));

main.append(hero, weekly || '', tools, channelButton({ block: true }));
