// 금지어·근거 검사기 (SB-12, F5) — 순수 함수. 브라우저(ops/filter/web)와 Node(cli·build) 공용.
// 파일을 읽지 않는다. 사전·소스 색인·카피는 호출자가 넘긴다.
//
// 결과: { verdict: 'block'|'warn'|'pass',
//         findings: [{ tier: '1'|'2'|'evidence'|'ending'|'required', word|pattern, location, sentence, start, end }],
//         required: { source, disclaimer, byline, noFear } }
// - 화이트리스트가 1·2군 부분 일치보다 우선한다(먼저 가린 뒤 검사).
// - 1군·근거 없음·필수 요건 미충족 → block / 2군·권유형 어미 → warn / 그 외 pass.
// - mode 'ui'(사이트 카피)는 근거·필수 요건 검사를 하지 않는다.

const MASK = '░'; // 가린 자리(길이 유지)

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 가릴 범위 [start, end) 목록으로 같은 길이의 MASK 문자열을 만든다 */
function maskRanges(text, ranges) {
  const chars = text.split(''); // 정규식 인덱스와 같은 코드 유닛 기준
  for (const [s, e] of ranges) for (let i = s; i < e; i += 1) if (chars[i] !== '\n') chars[i] = MASK;
  return chars.join('');
}

function allMatches(text, re) {
  const out = [];
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  let m;
  while ((m = g.exec(text))) {
    if (m[0] === '') { g.lastIndex += 1; continue; }
    out.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
  }
  return out;
}

/** 줄·칸·문단 위치 */
function locate(text, index) {
  const before = text.slice(0, index);
  const line = before.split('\n').length;
  const col = index - before.lastIndexOf('\n');
  const paragraph = before.split(/\n\s*\n/).length;
  return { line, col, paragraph };
}

/** 문장 범위: 마침표류·줄바꿈 기준 */
function sentences(text) {
  const out = [];
  const re = /[^\n.!?。]+(?:[.!?。]+(?:\s*\[S-[A-Z]{2,5}-\d{2}\])*|(?=\n)|$)/g;
  let m;
  while ((m = re.exec(text))) {
    if (!m[0].trim()) { if (m[0] === '') re.lastIndex += 1; continue; }
    out.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
  }
  return out;
}

function sentenceAt(sents, index) {
  return sents.find((s) => index >= s.start && index < s.end) || null;
}

/** 원고(마크다운) 구조: front matter·::: 블록 범위 */
function structure(text) {
  const fm = /^---\n[\s\S]*?\n---\n?/.exec(text);
  const meta = {};
  if (fm) for (const line of fm[0].split('\n')) { const m = /^([A-Za-z]+):\s*(.*?)\s*(#.*)?$/.exec(line); if (m) meta[m[1]] = m[2]; }
  const blocks = [];
  for (const m of text.matchAll(/^:::\s*(\w+)\s*\n([\s\S]*?)\n:::\s*$/gm)) blocks.push({ name: m[1], start: m.index, end: m.index + m[0].length, inner: m[2] });
  return { frontMatter: fm ? [0, fm[0].length] : null, meta, blocks };
}

/**
 * @param {string} text
 * @param {object} ctx
 * @param {object} ctx.dict      data/forbidden-words.json
 * @param {object} [ctx.sources] ops/sources/index.json  (근거 검사용)
 * @param {object} [ctx.copy]    data/copy.ko.json        (고지문·바이라인 확인용)
 * @param {'content'|'ui'} [ctx.mode='content']
 * @param {string[]} [ctx.endingExceptions]  권유형 어미 예외 문장(허브 히어로)
 */
export function checkText(text, ctx) {
  const { dict, sources = { sources: [] }, copy = null, mode = 'content' } = ctx;
  const src = String(text).replace(/\r\n?/g, '\n');
  const findings = [];
  const st = mode === 'content' ? structure(src) : { frontMatter: null, meta: {}, blocks: [] };

  // 0) 검사 대상에서 front matter 는 뺀다(메타데이터)
  const skip = st.frontMatter ? [st.frontMatter] : [];
  const base = maskRanges(src, skip);

  // 1) 화이트리스트 먼저 가림 — 긴 단어부터
  const wl = [...dict.whitelist.words].sort((a, b) => b.length - a.length);
  const wlRanges = [];
  for (const w of wl) for (const m of allMatches(maskRanges(base, wlRanges), new RegExp(escapeRe(w)))) wlRanges.push([m.start, m.end]);
  const masked = maskRanges(base, wlRanges);
  const sents = sentences(src);

  const push = (tier, key, value, m) => {
    const s = sentenceAt(sents, m.start);
    findings.push({ tier, [key]: value, match: src.slice(m.start, m.end), start: m.start, end: m.end, location: locate(src, m.start), sentence: s ? s.text.trim() : '' });
  };
  const wordRe = (w) => (/^[A-Za-z]+$/.test(w) ? new RegExp(`(?<![A-Za-z])${escapeRe(w)}(?![A-Za-z])`) : new RegExp(escapeRe(w)));

  // 2) 1군
  for (const w of dict.tier1_block.words) for (const m of allMatches(masked, wordRe(w))) push('1', 'word', w, m);
  for (const p of dict.tier1_block.patterns) for (const m of allMatches(masked, new RegExp(p))) push('1', 'pattern', p, m);
  // 1군과 겹치는 2군은 중복 표시하지 않는다
  const inTier1 = (m) => findings.some((f) => f.tier === '1' && m.start < f.end && m.end > f.start);

  // 3) 2군
  for (const w of dict.tier2_warn.words) for (const m of allMatches(masked, wordRe(w))) if (!inTier1(m)) push('2', 'word', w, m);

  // 4) 권유형 어미 (허브 히어로 등 예외 문장 제외)
  const exceptions = new Set(ctx.endingExceptions || []);
  for (const e of dict.ux_writing.forbiddenEndings) {
    for (const m of allMatches(masked, new RegExp(`${escapeRe(e)}(?=[\\s.!?~]|$)`))) {
      const s = sentenceAt(sents, m.start);
      if (s && exceptions.has(s.text.trim())) continue;
      if (findings.some((f) => f.tier === 'ending' && m.start < f.end && m.end > f.start)) continue; // '준비하세요' ⊃ '하세요'
      push('ending', 'word', e, m);
    }
  }

  let required = null;
  if (mode === 'content') {
    // 5) 근거 검사(F5-5): 패턴이 든 문장은 같은 문장 또는 같은 문단 끝에 출처 ID
    const idRe = new RegExp(dict.evidence_check.sourceIdPattern, 'g');
    const known = new Set((sources.sources || []).map((s) => s.id));
    const sourcesBlock = st.blocks.find((b) => b.name === 'sources');
    const evidenceSkip = [...skip, ...(sourcesBlock ? [[sourcesBlock.start, sourcesBlock.end]] : [])];
    const evText = maskRanges(src, evidenceSkip);
    const paragraphs = [];
    for (const m of evText.matchAll(/[^\n]+(?:\n(?!\s*\n)[^\n]+)*/g)) paragraphs.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
    const seen = new Set();
    for (const p of dict.evidence_check.patterns) {
      for (const m of allMatches(evText, new RegExp(p))) {
        const s = sentenceAt(sents, m.start);
        const para = paragraphs.find((q) => m.start >= q.start && m.start < q.end);
        const sentHasId = s && new RegExp(dict.evidence_check.sourceIdPattern).test(s.text);
        const paraEndHasId = para && new RegExp(`${dict.evidence_check.sourceIdPattern}[\\s.)]*$`).test(para.text.trim());
        const key = s ? `${s.start}` : `${m.start}`;
        if (!sentHasId && !paraEndHasId && !seen.has(key)) {
          seen.add(key);
          push('evidence', 'pattern', p, m);
        }
      }
    }
    // 본문에 쓴 출처 ID 는 소스 라이브러리에 있어야 한다
    for (const m of allMatches(evText, new RegExp(dict.evidence_check.sourceIdPattern))) {
      const id = m.text.replace(/[[\]]/g, '');
      if (!known.has(id)) push('evidence', 'sourceId', id, m);
    }
    // 출처 목록의 ID 도 같은 기준
    if (sourcesBlock) for (const m of allMatches(src.slice(0, sourcesBlock.end), idRe)) {
      if (m.start < sourcesBlock.start) continue;
      const id = m.text.replace(/[[\]]/g, '');
      if (!known.has(id)) push('evidence', 'sourceId', id, m);
    }

    // 6) 필수 요건
    const hasFrontMatter = Boolean(st.frontMatter);
    const listItems = sourcesBlock ? sourcesBlock.inner.split('\n').filter((l) => /^\s*-\s+\S/.test(l)) : [];
    const disclaimers = copy ? [copy.disclaimer.general, copy.disclaimer.tax] : [];
    const health = st.meta.category === 'health' || ctx.health === true;
    // 결론(본문 마지막 문단)이 '대비·준비' 권유로 끝나면 안 된다
    const bodyEnd = st.blocks.length ? Math.min(...st.blocks.filter((b) => b.name !== 'summary').map((b) => b.start).concat(src.length)) : src.length;
    const bodyParas = paragraphs.filter((q) => q.end <= bodyEnd && !/^\s*(##|:::|-\s)/.test(q.text) && q.text.trim() && !/^[\s░]+$/.test(q.text));
    const last = bodyParas[bodyParas.length - 1];
    const fearEnding = health && last && /(대비|준비)/.test(maskRanges(src, wlRanges).slice(last.start, last.end));
    required = {
      source: listItems.length > 0 || /https?:\/\//.test(src) || new RegExp(dict.evidence_check.sourceIdPattern).test(src),
      disclaimer: (hasFrontMatter && ['general', 'tax'].includes(st.meta.disclaimer)) || disclaimers.some((d) => d && src.includes(d)),
      byline: hasFrontMatter || (copy ? src.includes(copy.brand.byline) : false),
      noFear: !fearEnding,
    };
    const reqIds = { source: 'REQ-SOURCE', disclaimer: 'REQ-DISCLAIMER', byline: 'REQ-BYLINE', noFear: 'REQ-NO-FEAR' };
    for (const [k, ok] of Object.entries(required)) {
      if (!ok) {
        const at = k === 'noFear' && last ? last.start : 0;
        findings.push({ tier: 'required', rule: reqIds[k], match: '', start: at, end: at, location: locate(src, at), sentence: k === 'noFear' && last ? last.text.trim() : '' });
      }
    }
  }

  findings.sort((a, b) => a.start - b.start || a.tier.localeCompare(b.tier));
  const blocking = findings.some((f) => f.tier === '1' || f.tier === 'evidence' || f.tier === 'required');
  const warning = findings.some((f) => f.tier === '2' || f.tier === 'ending');
  return { verdict: blocking ? 'block' : warning ? 'warn' : 'pass', findings, required };
}

/** JSON(사이트 카피 등)의 문자열 값을 경로와 함께 모아 'ui' 모드로 검사 */
export function checkJSONStrings(obj, ctx) {
  const findings = [];
  const walk = (v, path) => {
    if (typeof v === 'string') {
      const r = checkText(v, { ...ctx, mode: 'ui' });
      for (const f of r.findings) findings.push({ ...f, location: { path, ...f.location } });
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (k !== '_meta') walk(x, path ? `${path}.${k}` : k);
  };
  walk(obj, '');
  const blocking = findings.some((f) => f.tier === '1');
  const warning = findings.length > 0;
  return { verdict: blocking ? 'block' : warning ? 'warn' : 'pass', findings, required: null };
}

export const EXIT = { pass: 0, warn: 1, block: 2 };
