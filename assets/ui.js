// 공통 컴포넌트 (SPEC §3, SB-06): 헤더 · 푸터 · 고지문 · 공유 · 채널 추가 · 오류 문구 · 바텀시트
// - 문구는 copy.ko(확정 카피)에서만 가져온다.
// - 서버로 보내는 요청이 없다. 외부 스크립트는 카카오 JS SDK 1개, 공유 버튼을 누를 때만 불러온다.
// - 공유 메시지는 고정 문구 + 공용 URL(쿼리 없음)만 담는다. 개인 입력값·결과값은 넣지 않는다.
import copy from './copy.ko.data.js';
import config from './config.js';

export { copy, config };

/** 사이트 루트(assets/ 의 상위). GitHub Pages 하위 경로 배포에서도 동작하도록 상대 계산 */
export const SITE_ROOT = new URL('../', import.meta.url);
export const sitePath = (path) => new URL(path.replace(/^\//, ''), SITE_ROOT).href;

/**
 * copy.ko.json 에 아직 없는 보조 표기(단위·접미사·접근성 라벨).
 * 확정 카피가 아니므로 운영자 확인 후 copy.ko.json 으로 옮긴다 — docs/OPEN_QUESTIONS.md Q4.
 */
export const LABELS = {
  close: '닫기',
  businessInfo: '사업자 정보 ↗',
  today: '오늘',
  birthSuffix: '생',
  baseDate: '기준일',
  ageUnit: '세',
  thisYear: '올해',
  dday: 'D-{days}',
  parity: { even: '짝수', odd: '홀수' },
  infoAria: '설명 보기',
  insuranceAgeTitle: '보험나이와 상령일',
  resultHeading: '결과',
  monthDay: '{m}월 {d}일',
};

/** 작은 DOM 헬퍼: 텍스트는 항상 textContent 로 넣는다 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

const HUB_PATH = SITE_ROOT.href;

/** ① 헤더. title 이 있으면 '← 도구 이름'(도구 화면), 없으면 사이트 로고(허브) */
export function header({ title } = {}) {
  const link = h('a', { class: 'site-header__link', href: HUB_PATH },
    title ? [h('span', { class: 'site-header__back', 'aria-hidden': 'true', text: '←' }), h('span', { text: title })]
          : h('span', { text: copy.brand.siteName }));
  if (title) link.setAttribute('aria-label', `${copy.brand.siteName} — ${title}`);
  return h('header', { class: 'site-header' }, link);
}

/** ⑥ 푸터: 운영 문구 + bluem-partners.com ↗ */
export function footer() {
  return h('footer', { class: 'site-footer' },
    h('p', { text: copy.brand.footer }),
    h('div', { class: 'site-footer__links' },
      h('a', { href: copy.brand.footerLink.url, target: '_blank', rel: 'noopener', text: copy.brand.footerLink.label }),
      config.BUSINESS_INFO_URL && h('a', { href: config.BUSINESS_INFO_URL, target: '_blank', rel: 'noopener', text: LABELS.businessInfo })));
}

/** ③ 고지문 — kind: 'general' | 'tax'. 접지 않는다 */
export function disclaimer(kind = 'general') {
  return h('p', { class: 'disclaimer', text: copy.disclaimer[kind] });
}

/** ⑤ 다른 도구 보기 → (허브) */
export function otherToolsLink() {
  return h('a', { class: 'text-link', href: HUB_PATH, text: copy.hub.otherTools });
}

// ── ④ 공유 · 채널 추가 ─────────────────────────────────────────

export function publicUrl(path) {
  return new URL(path.replace(/^\//, ''), config.SITE_URL || SITE_ROOT).href; // 쿼리·해시 없음
}

let kakaoReady = null;
function loadKakao() {
  if (kakaoReady) return kakaoReady;
  kakaoReady = new Promise((resolve, reject) => {
    if (window.Kakao) return resolve(window.Kakao);
    const s = document.createElement('script');
    s.src = config.KAKAO_SDK_URL;
    s.async = true;
    s.crossOrigin = 'anonymous';
    if (config.KAKAO_SDK_INTEGRITY) s.integrity = config.KAKAO_SDK_INTEGRITY;
    s.onload = () => (window.Kakao ? resolve(window.Kakao) : reject(new Error('kakao')));
    s.onerror = () => reject(new Error('kakao'));
    document.head.append(s);
  }).then((Kakao) => {
    if (!Kakao.isInitialized()) Kakao.init(config.KAKAO_JS_KEY);
    return Kakao;
  });
  kakaoReady.catch(() => { kakaoReady = null; });
  return kakaoReady;
}

export const shareAvailable = () => Boolean(config.KAKAO_JS_KEY) && navigator.onLine !== false;

/**
 * 카카오 공유 버튼. 고정 문구 + 공용 URL + 고정 썸네일만 보낸다.
 * 앱 키가 없거나 오프라인이거나 SDK 로드에 실패하면 이 버튼만 비활성.
 */
export function shareButton({ text, path }) {
  const btn = h('button', { type: 'button', class: 'btn btn--kakao', text: copy.hub.share });
  const sync = () => { btn.disabled = !shareAvailable(); };
  sync();
  window.addEventListener('online', sync);
  window.addEventListener('offline', sync);
  btn.addEventListener('click', async () => {
    if (!shareAvailable()) return;
    try {
      const Kakao = await loadKakao();
      const url = publicUrl(path);
      const link = { mobileWebUrl: url, webUrl: url };
      if (config.SHARE_THUMB_URL) {
        Kakao.Share.sendDefault({ objectType: 'feed', content: { title: text, imageUrl: config.SHARE_THUMB_URL, link } });
      } else {
        Kakao.Share.sendDefault({ objectType: 'text', text, link });
      }
    } catch {
      btn.disabled = true;
    }
  });
  return btn;
}

/** 채널 추가 = 카카오 채널 홈 링크(외부). 주소가 없으면 비활성 */
export function channelButton({ block = false } = {}) {
  const cls = `btn btn--kakao${block ? ' btn--block' : ''}`;
  if (!config.KAKAO_CHANNEL_URL) {
    return h('button', { type: 'button', class: cls, disabled: true, text: copy.hub.kakaoAdd });
  }
  return h('a', { class: cls, href: config.KAKAO_CHANNEL_URL, target: '_blank', rel: 'noopener', text: copy.hub.kakaoAdd });
}

// ── 입력 오류 문구 (SB-13): 필드 아래 빨간 한 줄, 모달 금지, 버튼은 활성 유지 ──

export function setFieldError(input, errorEl, message) {
  errorEl.textContent = message || '';
  if (message) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

// ── 바텀시트 (설명 표시용) ─────────────────────────────────────

export function bottomSheet({ id, title, body, closeLabel = LABELS.close }) {
  const dlg = h('dialog', { class: 'sheet', id, 'aria-labelledby': `${id}-title` },
    h('div', { class: 'sheet__panel' },
      h('h2', { class: 'sheet__title', id: `${id}-title`, text: title }),
      h('p', { text: body }),
      h('button', { type: 'button', class: 'btn btn--outline btn--block', text: closeLabel, onclick: () => dlg.close() })));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  return dlg;
}

/** 페이지 골격: 헤더 + main + 푸터 */
export function mountPage(root, { title }) {
  const main = h('main', { class: 'content', id: 'main' });
  root.replaceChildren(header({ title }), main, footer());
  return main;
}
