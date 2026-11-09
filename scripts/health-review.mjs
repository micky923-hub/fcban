// assets/healthData.json → docs/healthData-review.md (운영자 출처 대조 체크표)
//   node scripts/health-review.mjs
// - '1차 대조'는 Claude Code 가 공식 페이지와 비교한 결과(firstPass)다. 확정이 아니다.
// - 확정은 운영자가 원문을 보고 각 항목 reviewedAt 에 날짜를 넣는 것이다. 넣은 뒤 이 스크립트를 다시 돌린다.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(root, 'assets/healthData.json'), 'utf8'));
const cell = (v) => (v === null || v === undefined || v === '' ? '—' : String(v).replace(/\|/g, '\\|').replace(/\n/g, '<br>')); // 칸 안 줄바꿈은 <br> — 표가 깨지지 않게
const box = (v) => (v ? `☑ ${v}` : '☐');
const SECTION = { general: '국가건강검진', cancer: '국가암검진', common: '흔히 챙기는 것' };
const FP = { match: '✅ 일치', differs: '⚠️ 다름', notFound: '❔ 못 찾음' };
const fpCell = (fp) => (fp ? `${FP[fp.status] || fp.status}${fp.note ? `<br>${cell(fp.note)}` : ''}` : '— (1차 대조 전)');
const fpMeta = data._meta.firstPass || null;

const out = [];
out.push('# 건강 데이터 출처 대조표 (healthData.json)', '');
out.push(`- 데이터 버전: \`${data._meta.version}\` · 상태: **${data._meta.status}** · 생성: \`node scripts/health-review.mjs\``);
out.push('- 초안 작성자(Claude Code)는 처음에 출처 원문을 열람하지 않고 썼다.');
if (fpMeta) out.push(`- **1차 대조 ${fpMeta.checkedAt}** — ${cell(fpMeta.by)}. ${cell(fpMeta.method)}`);
out.push('- 확정 절차: ① 1차 대조 결과와 아래 원문 페이지를 직접 확인 → ② `assets/healthData.json` 해당 항목 `reviewedAt` 에 날짜(YYYY-MM-DD) → ③ 고위험군 설명은 원문 그대로 붙여 넣고 `verbatim: true` → ④ 전부 끝나면 `_meta.status` 를 `confirmed` → ⑤ `npm run sync` 후 이 스크립트 재실행. 그 전에는 화면에 **초안** 배지가 붙고 배포하지 않는다.', '');

// 요약
const items = data.sets.flatMap((s) => s.sections.flatMap((sec) => sec.items));
const uniq = new Map();
for (const s of data.sets) for (const sec of s.sections) for (const i of sec.items) {
  const key = `${i.id}|${i.cycle}`;
  if (!uniq.has(key)) uniq.set(key, { ...i, section: sec.id, sets: [] });
  uniq.get(key).sets.push(`${s.ageGroup}/${s.sex}`);
}
const rows = [...uniq.values()];
const count = (st) => rows.filter((i) => i.firstPass?.status === st).length;
out.push('## 요약', '');
out.push(`| 구분 | 수 |`, '|---|---|');
out.push(`| 대조할 항목(중복 제거) | ${rows.length} |`);
out.push(`| 1차 대조 ✅ 일치 | ${count('match')} |`);
out.push(`| 1차 대조 ⚠️ 다름 | ${count('differs')} |`);
out.push(`| 고위험군 설명 ⚠️ 다름 | ${Object.values(data.info).filter((v) => v.firstPass?.status === 'differs').length} / ${Object.keys(data.info).length} |`);
out.push(`| 원문에 있는데 초안에 없는 항목 | ${fpMeta?.missingFromDraft?.length ?? 0} |`);
out.push(`| 운영자 확정(reviewedAt) | ${items.filter((i) => i.reviewedAt).length} / ${items.length} (세트별 항목 수 기준) |`, '');

out.push('## 출처', '', '| ID | 제목 | 기관 | URL | 1차 대조 | 운영자 확인일 |', '|---|---|---|---|---|---|');
for (const [id, s] of Object.entries(data.sources)) out.push(`| \`${id}\` | ${cell(s.title)} | ${cell(s.publisher)} | ${cell(s.url)} | ${cell(s.firstPassAt)} | ${box(s.checkedAt)} |`);
out.push('');

out.push('## 고위험군 설명 (ⓘ 바텀시트 — 출처 원문 그대로 표시해야 함)', '', '| 키 | 지금 화면 문구(초안) | 1차 대조 | 원문 후보 | 바꿀 제안 | 운영자 확정 |', '|---|---|---|---|---|---|');
for (const [k, v] of Object.entries(data.info)) {
  out.push(`| \`${k}\` | ${cell(v.text)} | ${fpCell(v.firstPass)} | ${cell(v.firstPass?.quote)} | ${cell(v.firstPass?.proposal)} | ${box(v.reviewedAt)} |`);
}
out.push('', '> 원문 후보는 페이지 요약 도구를 거쳐 옮긴 것이다. 화면에 넣기 전에 원문 페이지에서 글자를 직접 확인한다.', '');

const differs = rows.filter((i) => i.firstPass?.status === 'differs');
if (differs.length) {
  out.push('## ⚠️ 원문과 다른 항목 — 바꿀 제안 (데이터는 아직 바꾸지 않음)', '', '| ID | 항목 | 지금 주기 | 원문 | 바꿀 제안 | 쓰이는 세트 |', '|---|---|---|---|---|---|');
  for (const i of differs) out.push(`| \`${i.id}\` | ${cell(i.name)} | ${cell(i.cycle)} | ${cell(i.firstPass.note)} | ${cell(i.firstPass.proposal)} | ${i.sets.join(', ')} |`);
  out.push('');
}

if (fpMeta?.missingFromDraft?.length) {
  out.push('## ➕ 원문에 있는데 아직 넣지 않은 항목 (운영자 결정)', '', '| 항목 | 넣을 곳 | 대상 · 주기 | 출처 | 비고 |', '|---|---|---|---|---|');
  for (const m of fpMeta.missingFromDraft) out.push(`| ${cell(m.name)} | ${cell(m.where)} | ${cell(m.cycle)} | \`${m.sourceId}\` | ${cell(m.note)} |`);
  out.push('', `> '흔히 챙기는 것' 최대 ${data.limits?.commonMax ?? '—'}개. 넣으면 넘치는 세트가 있는지 아래 '세트별 구성'에서 확인한다.`, '');
}

out.push('## 항목별 대조 (같은 항목은 한 번만 대조)', '', '| 섹션 | ID | 항목 | 주기 | 검사 | 출처 | 1차 대조 | 쓰이는 세트 | 운영자 확정 |', '|---|---|---|---|---|---|---|---|---|');
for (const i of rows) out.push(`| ${SECTION[i.section]} | \`${i.id}\` | ${cell(i.name)} | ${cell(i.cycle)} | ${cell(i.test)} | \`${i.sourceId}\` | ${fpCell(i.firstPass)} | ${i.sets.join(', ')} | ${box(i.reviewedAt)} |`);
out.push('');

out.push('## 세트별 구성 (빠진 항목·성별 조건 확인)', '');
for (const s of data.sets) {
  out.push(`### ${s.ageGroup} / ${s.sex}`, '');
  for (const sec of s.sections) {
    const names = sec.items.map((i) => [i.name, i.cycle].filter(Boolean).join(' · '));
    const n = sec.id === 'common' && data.limits ? ` (${sec.items.length}/${data.limits.commonMax})` : '';
    out.push(`- **${SECTION[sec.id]}**${n}: ${names.length ? names.join(' / ') : '(없음)'}`);
  }
  out.push('');
}
writeFileSync(join(root, 'docs/healthData-review.md'), out.join('\n'));
console.log('docs/healthData-review.md');
