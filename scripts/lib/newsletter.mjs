// 뉴스레터 글(SB-09): 마크다운 해석 → 슬롯 검사 → 정적 HTML. 순수 함수만 둔다(파일 입출력은 build.mjs).
//
// 원고 형식 (content/*.md)
// ---
// title: 50대 건강검진, 이것만은 꼭
// slug: week-2026-46
// category: health            # data/newsletterRules.json categories
// publishedAt: 2026-11-12
// tool: health                # 도구 링크 카드 1개
// disclaimer: general         # general | tax
// approvedAt: 2026-11-10      # 운영자 승인(ops/review) — 없으면 빌드 대상이 아니다
// approvedBy: 반동수
// ---
// 본문 문단 … [S-HLT-01]
// ## 소제목 (2–3개)
// ::: summary   (- 줄, 2–3줄)
// ::: dongui    (quote: / source: / view: / practice:)
// ::: sources   (- [S-HLT-01] 제목 | https://…)

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const REF = /\[(S-[A-Z]{2,5}-\d{2})\]/g;

/** front matter + 본문 + ::: 블록 분리 */
export function parseArticle(md) {
  const text = String(md).replace(/\r\n?/g, '\n');
  const fm = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  const meta = {};
  if (fm) {
    for (const line of fm[1].split('\n')) {
      const m = /^([A-Za-z]+):\s*(.*?)\s*(#.*)?$/.exec(line);
      if (m) meta[m[1]] = m[2];
    }
  }
  let rest = fm ? text.slice(fm[0].length) : text;
  const blocks = {};
  rest = rest.replace(/^:::\s*(\w+)\s*\n([\s\S]*?)\n:::\s*$/gm, (_, name, inner) => {
    blocks[name] = inner;
    return `\n@@block:${name}@@\n`;
  });
  return { meta, body: rest.trim(), blocks };
}

const listLines = (s) => (s || '').split('\n').map((l) => l.trim()).filter((l) => l.startsWith('- ')).map((l) => l.slice(2).trim());

function parseDongui(s) {
  const out = {};
  for (const line of (s || '').split('\n')) {
    const m = /^(quote|source|view|practice):\s*(.+)$/.exec(line.trim());
    if (m) out[m[1]] = m[2].replace(/^["“]|["”]$/g, '').trim();
  }
  return out;
}

function parseSources(s) {
  return listLines(s).map((l) => {
    const m = /^\[(S-[A-Z]{2,5}-\d{2})\]\s*(.+?)(?:\s*\|\s*(https?:\/\/\S+))?$/.exec(l);
    return m ? { id: m[1], title: m[2].trim(), url: m[3] || null } : { id: null, raw: l };
  });
}

/** 본문 블록 단위: { type: 'h2'|'p'|'ul'|'block', text|items|name } */
export function bodyBlocks(body) {
  const out = [];
  for (const chunk of body.split(/\n{2,}/)) {
    const c = chunk.trim();
    if (!c) continue;
    const blk = /^@@block:(\w+)@@$/.exec(c);
    if (blk) out.push({ type: 'block', name: blk[1] });
    else if (/^##\s+/.test(c) && !c.includes('\n')) out.push({ type: 'h2', text: c.replace(/^##\s+/, '') });
    else if (/^#{1,6}\s/.test(c)) out.push({ type: 'badheading', text: c });
    else if (c.split('\n').every((l) => l.trim().startsWith('- '))) out.push({ type: 'ul', items: listLines(c) });
    else out.push({ type: 'p', text: c.replace(/\n/g, ' ') });
  }
  return out;
}

/** 글자 수 셈용 평문: 마크다운 기호·출처 표시 제거, 공백 하나로 */
export function plain(s) {
  return String(s).replace(REF, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, '$1').replace(/\s+/g, ' ').trim();
}

export function bodyChars(blocks) {
  return blocks.filter((b) => b.type !== 'block').map((b) => (b.type === 'ul' ? b.items.join(' ') : b.text)).map(plain).join(' ').length;
}

/** 발행일 → 'M월 W주' (W = 올림(일/7)) */
export function weekLabel(iso, rules) {
  const [, m, d] = iso.split('-').map(Number);
  return rules.weekLabel.format.replace('{m}', m).replace('{w}', Math.ceil(d / 7));
}

/**
 * 원고 검사. errors 가 하나라도 있으면 빌드 실패.
 * @returns {{ ok:boolean, errors:string[], article?:object }}
 */
export function validateArticle(md, { rules, copy }) {
  const { meta, body, blocks } = parseArticle(md);
  const errors = [];
  const need = (k) => { if (!meta[k]) errors.push(`front matter '${k}' 없음`); };
  ['title', 'slug', 'category', 'publishedAt', 'tool', 'disclaimer'].forEach(need);
  if (meta.slug && !new RegExp(rules.slugPattern).test(meta.slug)) errors.push(`slug 형식: ${meta.slug}`);
  if (meta.publishedAt && !/^\d{4}-\d{2}-\d{2}$/.test(meta.publishedAt)) errors.push('publishedAt 은 YYYY-MM-DD');
  const category = rules.categories.find((c) => c.id === meta.category);
  if (meta.category && !category) errors.push(`category: ${meta.category} (허용: ${rules.categories.map((c) => c.id).join(', ')})`);
  const tool = copy.hub.tools.find((t) => t.id === meta.tool);
  if (meta.tool && (!tool || !rules.tools.includes(meta.tool))) errors.push(`tool: ${meta.tool} — 도구 링크 카드는 1개(${rules.tools.join('|')})`);
  if (meta.disclaimer && !rules.disclaimers.includes(meta.disclaimer)) errors.push(`disclaimer: ${meta.disclaimer}`);

  const bb = bodyBlocks(body);
  bb.filter((b) => b.type === 'badheading').forEach((b) => errors.push(`소제목은 '## ' 만 씁니다: ${b.text.slice(0, 20)}`));
  const subheads = bb.filter((b) => b.type === 'h2').length;
  if (subheads < rules.body.subheadMin || subheads > rules.body.subheadMax) errors.push(`소제목 ${subheads}개 (${rules.body.subheadMin}–${rules.body.subheadMax})`);
  const chars = bodyChars(bb);
  if (chars < rules.body.minChars || chars > rules.body.maxChars) errors.push(`본문 ${chars}자 (${rules.body.minChars}–${rules.body.maxChars})`);
  if (/<[a-z!/]/i.test(body)) errors.push('본문에 HTML 태그를 쓰지 않습니다');

  const summary = listLines(blocks.summary);
  if (!blocks.summary) errors.push('핵심 요약(::: summary) 없음');
  else if (summary.length < rules.summary.minLines || summary.length > rules.summary.maxLines) errors.push(`핵심 요약 ${summary.length}줄 (${rules.summary.minLines}–${rules.summary.maxLines})`);

  const dongui = parseDongui(blocks.dongui);
  if (!blocks.dongui) errors.push('동의보감 한 줄(::: dongui) 없음');
  else for (const k of ['quote', 'source', 'view', 'practice']) if (!dongui[k]) errors.push(`동의보감 '${k}' 없음`);

  const sources = parseSources(blocks.sources);
  sources.filter((s) => !s.id).forEach((s) => errors.push(`출처 형식: ${s.raw}`));
  const valid = sources.filter((s) => s.id);
  if (valid.length < rules.sources.min) errors.push('출처 없음 — 공공기관·학회 출처 1개 이상 필요');
  const ids = new Set(valid.map((s) => s.id));
  const refs = new Set([...body.matchAll(REF), ...(blocks.summary || '').matchAll(REF)].map((m) => m[1]));
  for (const r of refs) if (!ids.has(r)) errors.push(`본문 출처 표시 [${r}] 가 출처 목록에 없음`);
  for (const k of Object.keys(blocks)) if (!['summary', 'dongui', 'sources'].includes(k)) errors.push(`알 수 없는 블록 ::: ${k}`);

  if (errors.length) return { ok: false, errors };
  const donguiLine = `“${dongui.quote}” — ${dongui.source}`;
  const readChars = chars + summary.map(plain).join(' ').length + plain(`${dongui.quote} ${dongui.view} ${dongui.practice}`).length;
  return {
    ok: true,
    errors,
    article: {
      meta, category, tool, blocks: bb, summary, dongui, sources: valid, chars,
      approved: Boolean(meta.approvedAt && /^\d{4}-\d{2}-\d{2}$/.test(meta.approvedAt) && meta.approvedBy),
      readMin: Math.max(1, Math.ceil(readChars / rules.readTime.charsPerMinute)),
      donguiLine,
      weekLabel: weekLabel(meta.publishedAt, rules),
    },
  };
}

/** 인라인: **굵게**, [링크](https…), [S-XXX-NN] → 출처 번호 */
function inline(s, refNo, refLabel = '') {
  let out = esc(s);
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, t, u) => `<a href="${u}" target="_blank" rel="noopener">${t} ↗</a>`);
  out = out.replace(REF, (_, id) => `<a class="ref" href="#src-${id}" aria-label="${esc(refLabel)} ${refNo(id)}">[${refNo(id)}]</a>`);
  return out;
}

/** 글 → 정적 HTML 한 장. 스크립트 없음(광고·추적 없음). */
export function renderArticle(a, { copy, siteRoot = '../../', businessInfo = null }) {
  const N = copy.newsletter;
  const no = (id) => a.sources.findIndex((s) => s.id === id) + 1;
  const refNo = Object.assign(no, {});
  const inl = (s) => inline(s, refNo, N.sourceLabel);
  const date = a.meta.publishedAt.replaceAll('-', '.');
  const body = [];
  let summaryPlaced = false;
  const summaryHtml = `<section class="nl-summary card" aria-labelledby="nl-summary-title"><h2 class="nl-box-title" id="nl-summary-title">${esc(N.summaryLabel)}</h2><ul class="bullets">${a.summary.map((l) => `<li>${inl(l)}</li>`).join('')}</ul></section>`;
  for (const b of a.blocks) {
    if (b.type === 'block') continue;
    if (b.type === 'h2') body.push(`<h2 class="nl-h2">${inl(b.text)}</h2>`);
    else if (b.type === 'ul') body.push(`<ul class="bullets nl-list">${b.items.map((i) => `<li>${inl(i)}</li>`).join('')}</ul>`);
    else body.push(`<p>${inl(b.text)}</p>`);
    // 핵심 요약은 본문 상단 — 첫 문단 바로 뒤 (SB-09 ②)
    if (!summaryPlaced && b.type === 'p') { body.push(summaryHtml); summaryPlaced = true; }
  }
  if (!summaryPlaced) body.unshift(summaryHtml);
  const toolHref = `${siteRoot}${a.tool.path.replace(/^\//, '')}`;
  const title = esc(a.meta.title);
  const desc = esc(a.summary.map(plain).join(' '));

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${title} · ${esc(copy.brand.siteName)}</title>
  <meta name="description" content="${desc}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta name="theme-color" content="#0C2340">
  <meta name="format-detection" content="telephone=no">
  <link rel="icon" href="${siteRoot}favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="${siteRoot}assets/icons/favicon-32.png">
  <link rel="apple-touch-icon" href="${siteRoot}assets/icons/apple-touch-icon.png">
  <link rel="stylesheet" href="${siteRoot}assets/base.css">
  <style>
    .nl-kicker { font-size: var(--fs-label); font-weight: 700; color: var(--c-accent); }
    .nl-title { margin-top: var(--sp-1); font-size: var(--fs-title); font-weight: 700; line-height: 1.4; }
    .nl-meta { margin-top: var(--sp-2); font-size: var(--fs-label); color: var(--c-muted); }
    .nl-body { display: flex; flex-direction: column; gap: var(--sp-4); font-size: var(--fs-body); line-height: 1.7; }
    .nl-h2 { margin-top: var(--sp-2); font-size: 18px; font-weight: 700; line-height: 1.45; }
    .nl-box-title { font-size: 15px; font-weight: 700; }
    .nl-body .bullets li { font-size: var(--fs-body); }
    .ref { font-size: var(--fs-label); color: var(--c-muted); text-decoration: none; vertical-align: super; }
    .nl-tool { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); min-height: 56px; padding: var(--sp-3) var(--sp-4); border: 1px solid var(--c-line); border-radius: var(--radius); color: var(--c-ink); text-decoration: none; font-weight: 700; }
    .nl-dongui { border: 1px solid var(--c-line); background: var(--c-white); }
    .nl-dongui p { margin-top: var(--sp-2); font-size: 15px; line-height: 1.6; }
    .nl-dongui__label { font-weight: 700; color: var(--c-muted); }
    .nl-sources { font-size: var(--fs-label); color: var(--c-muted); }
    .nl-sources ol { margin-top: var(--sp-1); padding-left: 1.4em; list-style: decimal; }
    .nl-sources a { color: var(--c-muted); }
  </style>
</head>
<body>
  <div class="page">
    <header class="site-header"><a class="site-header__link" href="${siteRoot}">${esc(copy.brand.siteName)}</a></header>
    <main class="content" id="main">
      <article class="nl-body" aria-labelledby="nl-title">
        <header>
          <p class="nl-kicker">${esc(a.category.label)} · ${esc(a.weekLabel)}</p>
          <h1 class="nl-title" id="nl-title">${title}</h1>
          <p class="nl-meta">${esc(copy.brand.byline)} · ${date} · ${esc(copy.hub.readMore.replace(/\s*→$/, '').replace('{min}', a.readMin).replace(/^읽는 시간\s*/, ''))}</p>
        </header>
        ${body.join('\n        ')}
        <a class="nl-tool" href="${toolHref}"><span>${esc(N.toolCardPrefix)}${esc(a.tool.title)}</span><span aria-hidden="true">→</span></a>
        <section class="card nl-dongui" aria-labelledby="nl-dongui-title">
          <h2 class="nl-box-title" id="nl-dongui-title">${esc(N.donguiLabel)}</h2>
          <p>“${esc(a.dongui.quote)}” — ${esc(a.dongui.source)}</p>
          <p><span class="nl-dongui__label">${esc(N.donguiTodayLabel)}</span> ${inl(a.dongui.view)}</p>
          <p>${inl(a.dongui.practice)}</p>
        </section>
        <section class="nl-sources" aria-labelledby="nl-sources-title">
          <h2 class="nl-box-title" id="nl-sources-title">${esc(N.sourceLabel)}</h2>
          <ol>${a.sources.map((s) => `<li id="src-${s.id}">${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)} ↗</a>` : esc(s.title)}</li>`).join('')}</ol>
        </section>
        <p class="disclaimer">${esc(copy.disclaimer[a.meta.disclaimer])}</p>
      </article>
      <a class="text-link" href="${siteRoot}">${esc(copy.hub.otherTools)}</a>
    </main>
    <footer class="site-footer">
      <p>${esc(copy.brand.footer)}</p>
      <div class="site-footer__links"><a href="${esc(copy.brand.footerLink.url)}" target="_blank" rel="noopener">${esc(copy.brand.footerLink.label)}</a>${businessInfo && businessInfo.url ? `<a href="${esc(businessInfo.url)}" target="_blank" rel="noopener">${esc(businessInfo.label)}</a>` : ''}</div>
    </footer>
  </div>
</body>
</html>
`;
}

/** 허브용 weekly.json: 승인·발행일이 지난 글 중 발행일이 가장 늦은 1건 */
export function pickWeekly(articles, todayISO) {
  const live = articles.filter((a) => a.approved && a.meta.publishedAt <= todayISO).sort((x, y) => (x.meta.publishedAt < y.meta.publishedAt ? 1 : -1));
  const a = live[0];
  if (!a) return null;
  return { title: a.meta.title, slug: a.meta.slug, donguiLine: a.donguiLine, readMin: a.readMin, publishedAt: a.meta.publishedAt, weekLabel: a.weekLabel, summary: a.summary.map(plain) };
}

/**
 * 상태 페이지(SB-13): 404 · 내려간 글. 정적 HTML, 스크립트 없음, 허브로 가는 버튼 1개(검색창 없음).
 * @param {object} o
 * @param {string} o.siteRoot  자산·허브 경로 기준('../../' 또는 404 용 절대 경로 '/…/')
 */
export function renderStatePage({ copy, siteRoot, title, sub = null, businessInfo = null, noindex = true }) {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)} · ${esc(copy.brand.siteName)}</title>
  ${noindex ? '<meta name="robots" content="noindex">' : ''}
  <meta name="theme-color" content="#0C2340">
  <link rel="icon" href="${siteRoot}favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="${siteRoot}assets/icons/favicon-32.png">
  <link rel="apple-touch-icon" href="${siteRoot}assets/icons/apple-touch-icon.png">
  <link rel="stylesheet" href="${siteRoot}assets/base.css">
</head>
<body>
  <div class="page">
    <header class="site-header"><a class="site-header__link" href="${siteRoot}"><span class="site-header__back" aria-hidden="true">←</span> ${esc(copy.brand.siteName)}</a></header>
    <main class="content" id="main">
      <div>
        <h1 class="page-title">${esc(title)}</h1>
        ${sub ? `<p class="page-sub">${esc(sub)}</p>` : ''}
      </div>
      <a class="btn btn--primary btn--block" href="${siteRoot}">${esc(copy.states.notFoundCta)}</a>
    </main>
    <footer class="site-footer">
      <p>${esc(copy.brand.footer)}</p>
      <div class="site-footer__links"><a href="${esc(copy.brand.footerLink.url)}" target="_blank" rel="noopener">${esc(copy.brand.footerLink.label)}</a>${businessInfo && businessInfo.url ? `<a href="${esc(businessInfo.url)}" target="_blank" rel="noopener">${esc(businessInfo.label)}</a>` : ''}</div>
    </footer>
  </div>
</body>
</html>
`;
}

/** front matter 만 빠르게 읽기 (내려간 글 판별용) */
export function frontMatter(md) {
  return parseArticle(md).meta;
}
