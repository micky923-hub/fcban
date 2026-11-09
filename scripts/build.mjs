// content/*.md → diary/{slug}/index.html + content/weekly.json (+ index.html 의 주간 글 자리)
//   node scripts/build.mjs [--today YYYY-MM-DD] [--allow-missing-filter]
//
// - 원고마다 슬롯·분량 검사(scripts/lib/newsletter.mjs). 하나라도 어기면 빌드 실패(exit 1).
// - 원고마다 금지어·근거 검사(ops/filter). block 이면 빌드 실패. 검사기가 없으면 실패(순서 6 전까지는 --allow-missing-filter).
// - 운영자 승인(approvedAt·approvedBy)이 없는 원고, 발행일이 오늘 이후인 원고는 페이지를 만들지 않는다.
// - 이 스크립트는 사람이 직접 실행한다. 크론·웹훅·스케줄러에 연결하지 않는다(CLAUDE.md 규칙 4).
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { validateArticle, renderArticle, pickWeekly } from './lib/newsletter.mjs';
import { inlineWeekly } from './inline-weekly.mjs';
import { config, LABELS } from '../assets/ui.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = (p) => JSON.parse(readFileSync(p, 'utf8'));

/** ops/filter 검사기를 불러온다. 없으면 null */
export async function loadFilter(root = ROOT) {
  const p = join(root, 'ops', 'filter', 'filter.mjs');
  if (!existsSync(p)) return null;
  const mod = await import(pathToFileURL(p).href);
  return mod.checkText;
}

/**
 * @param {object} o
 * @param {string} o.root         저장소 루트(산출물 위치)
 * @param {string} o.contentDir   원고 폴더
 * @param {string} o.today        'YYYY-MM-DD'
 * @param {Function|null} o.filter  (md) => { verdict: 'pass'|'warn'|'block', findings }
 * @param {boolean} o.allowMissingFilter
 * @param {boolean} [o.write=true]
 */
export function build({ root = ROOT, contentDir = join(ROOT, 'content'), today, filter, allowMissingFilter = false, write = true }) {
  const rules = readJSON(join(ROOT, 'data', 'newsletterRules.json'));
  const copy = readJSON(join(ROOT, 'data', 'copy.ko.json'));
  const log = [];
  const errors = [];
  if (!filter && !allowMissingFilter) errors.push('금지어·근거 검사기(ops/filter/filter.mjs)가 없습니다 — 검사 없이 발행하지 않습니다');

  const files = existsSync(contentDir) ? readdirSync(contentDir).filter((f) => f.endsWith('.md') && !f.startsWith('_')).sort() : [];
  const articles = [];
  const slugs = new Map();
  for (const f of files) {
    const md = readFileSync(join(contentDir, f), 'utf8');
    const v = validateArticle(md, { rules, copy });
    if (!v.ok) { v.errors.forEach((e) => errors.push(`${f}: ${e}`)); continue; }
    if (filter) {
      const r = filter(md);
      if (r.verdict === 'block') { errors.push(`${f}: 금지어·근거 검사 block (${r.findings.length}건)`); continue; }
      if (r.verdict === 'warn') log.push(`${f}: 금지어 2군 경고 ${r.findings.length}건 — 승인 로그의 사유 확인`);
    }
    const a = v.article;
    if (slugs.has(a.meta.slug)) { errors.push(`${f}: slug 중복 (${slugs.get(a.meta.slug)})`); continue; }
    slugs.set(a.meta.slug, f);
    if (!a.approved) { log.push(`${f}: 승인 전 — 건너뜀`); continue; }
    if (a.meta.publishedAt > today) { log.push(`${f}: 발행일 ${a.meta.publishedAt} 전 — 건너뜀`); continue; }
    articles.push({ file: f, ...a });
  }

  if (errors.length) return { ok: false, errors, log, pages: [], weekly: null };

  const weekly = pickWeekly(articles, today);
  const pages = articles.map((a) => ({ path: join('diary', a.meta.slug, 'index.html'), html: renderArticle(a, { copy, businessInfo: { url: config.BUSINESS_INFO_URL, label: LABELS.businessInfo } }) }));
  if (write) {
    for (const p of pages) {
      mkdirSync(dirname(join(root, p.path)), { recursive: true });
      writeFileSync(join(root, p.path), p.html);
    }
    mkdirSync(join(root, 'content'), { recursive: true });
    writeFileSync(join(root, 'content', 'weekly.json'), `${JSON.stringify(weekly, null, 2)}\n`);
    const indexPath = join(root, 'index.html');
    writeFileSync(indexPath, inlineWeekly(readFileSync(indexPath, 'utf8'), weekly));
  }
  return { ok: true, errors, log, pages, weekly };
}

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const today = arg('--today') || localToday();
  const filter = await loadFilter();
  const r = build({ today, filter, allowMissingFilter: process.argv.includes('--allow-missing-filter') });
  r.log.forEach((l) => console.log(`· ${l}`));
  if (!r.ok) {
    r.errors.forEach((e) => console.error(`✗ ${e}`));
    console.error(`빌드 실패 — ${r.errors.length}건`);
    process.exit(1);
  }
  r.pages.forEach((p) => console.log(`✓ ${p.path}`));
  console.log(`weekly: ${r.weekly ? r.weekly.slug : '(없음 — 허브 영역 숨김)'}`);
}
