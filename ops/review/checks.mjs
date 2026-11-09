// 원고 검사: 슬롯(블로그) + 금지어·근거(ops/filter). 에이전트 제출 시, 승인 시, 발행 시 모두 다시 돌린다.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkText, meta } from '../filter/filter.mjs';
import { validateArticle } from '../../scripts/lib/newsletter.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const rules = readJSON('data/newsletterRules.json');
const copy = readJSON('data/copy.ko.json');
export const sourcesIndex = () => readJSON('ops/sources/index.json');

/** 원고 종류별 필수 요건: 블로그는 4가지 전부, 채널 메시지·카드뉴스는 출처·결론만(고지문·바이라인은 블로그 글에 있음) */
const REQUIRED_BY_KIND = { blog: ['source', 'disclaimer', 'byline', 'noFear'], message: ['source', 'noFear'], cardnews: ['source', 'noFear'] };
const REQ_KEY = { 'REQ-SOURCE': 'source', 'REQ-DISCLAIMER': 'disclaimer', 'REQ-BYLINE': 'byline', 'REQ-NO-FEAR': 'noFear' };

/**
 * @returns {{ verdict, counts, findings, slotErrors, filterVersion, checkedAt, article? }}
 */
export function checkDraft(md, kind = 'blog', now = new Date()) {
  const r = checkText(md);
  const needed = REQUIRED_BY_KIND[kind] || REQUIRED_BY_KIND.blog;
  const findings = r.findings.filter((f) => f.tier !== 'required' || needed.includes(REQ_KEY[f.rule]));
  let slotErrors = [];
  let article = null;
  if (kind === 'blog') {
    const v = validateArticle(md, { rules, copy });
    slotErrors = v.errors;
    article = v.article || null;
  }
  const n = (t) => findings.filter((f) => f.tier === t).length;
  const countsObj = { tier1: n('1'), tier2: n('2'), evidence: n('evidence'), ending: n('ending'), required: n('required'), slot: slotErrors.length };
  const blocking = countsObj.tier1 || countsObj.evidence || countsObj.required || countsObj.slot;
  const verdict = blocking ? 'block' : countsObj.tier2 || countsObj.ending ? 'warn' : 'pass';
  return {
    verdict,
    counts: countsObj,
    findings: findings.map(({ tier, word, pattern, sourceId, rule, match, location, sentence }) => ({ tier, word, pattern, sourceId, rule, match, location, sentence })),
    slotErrors,
    filterVersion: meta().filterVersion,
    checkedAt: now.toISOString(),
    article: article && { title: article.meta.title, slug: article.meta.slug, chars: article.chars, sources: article.sources.length, summary: article.summary, tool: article.tool.id, weekLabel: article.weekLabel },
  };
}

export const stateForVerdict = (v) => (v === 'block' ? 'blocked' : v === 'warn' ? 'warned' : 'draft_pending');

/** front matter 값 넣기/바꾸기 (승인 시 approvedAt·approvedBy·publishedAt) */
export function setFrontMatter(md, kv) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(md);
  if (!m) throw new Error('front matter 없음');
  const lines = m[1].split('\n');
  for (const [k, v] of Object.entries(kv)) {
    const i = lines.findIndex((l) => new RegExp(`^${k}:`).test(l));
    const line = `${k}: ${String(v).replace(/\n/g, ' ')}`;
    if (i >= 0) lines[i] = line; else lines.push(line);
  }
  return `---\n${lines.join('\n')}\n---\n${md.slice(m[0].length)}`;
}

/** 개요 검사: 제목 3안 · 목차 · 사용할 출처 ID(라이브러리에 있어야) */
export function validateOutline(o) {
  const errors = [];
  if (!['blog', 'message', 'cardnews'].includes(o.kind)) errors.push('kind 는 blog | message | cardnews');
  if (!Array.isArray(o.titles) || o.titles.filter((t) => String(t).trim()).length !== 3) errors.push('제목은 3안');
  if (!Array.isArray(o.toc) || !o.toc.length) errors.push('목차가 비었습니다');
  const known = new Set(sourcesIndex().sources.map((s) => s.id));
  if (!Array.isArray(o.sourceIds) || !o.sourceIds.length) errors.push('사용할 출처 ID 가 없습니다');
  else for (const id of o.sourceIds) if (!known.has(id)) errors.push(`소스 라이브러리에 없는 ID: ${id}`);
  const text = [o.titles, o.toc, o.note].flat().filter(Boolean).join('\n');
  const f = checkText(text, { mode: 'ui' });
  if (f.findings.some((x) => x.tier === '1')) errors.push('개요에 1군 단어가 있습니다');
  return errors;
}
