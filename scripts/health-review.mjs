// assets/healthData.json → docs/healthData-review.md (운영자 출처 대조 체크표)
//   node scripts/health-review.mjs
// 대조를 마치면 healthData.json 의 각 항목 reviewedAt 을 채우고, 이 스크립트를 다시 돌려 표를 갱신한다.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(root, 'assets/healthData.json'), 'utf8'));
const cell = (v) => (v === null || v === undefined || v === '' ? '—' : String(v).replace(/\|/g, '\\|'));
const box = (v) => (v ? `☑ ${v}` : '☐');
const SECTION = { general: '국가건강검진', cancer: '국가암검진', common: '흔히 챙기는 것' };

const out = [];
out.push('# 건강 데이터 출처 대조표 (healthData.json)', '');
out.push(`- 데이터 버전: \`${data._meta.version}\` · 상태: **${data._meta.status}** · 생성: \`node scripts/health-review.mjs\``);
out.push('- **이 초안은 작성자(Claude Code)가 출처 원문을 직접 열람하지 않고 작성했다.** 모든 항목·주기·연령·검사명이 대조 대상이다.');
out.push('- 확정 절차: ① 아래 출처 원문과 대조 → ② `assets/healthData.json` 해당 항목 `reviewedAt` 에 날짜(YYYY-MM-DD) → ③ 고위험군 설명은 원문 그대로 붙여 넣고 `verbatim: true` → ④ 전부 끝나면 `_meta.status` 를 `confirmed` → ⑤ `npm run sync` 후 이 스크립트 재실행. 그 전에는 화면에 **초안** 배지가 붙고 배포하지 않는다.', '');

out.push('## 출처', '', '| ID | 제목 | 기관 | URL | 확인일 |', '|---|---|---|---|---|');
for (const [id, s] of Object.entries(data.sources)) out.push(`| \`${id}\` | ${cell(s.title)} | ${cell(s.publisher)} | ${cell(s.url)} | ${box(s.checkedAt)} |`);
out.push('', '> URL 은 기관 대표 주소만 적어 두었다. 대조에 쓴 실제 안내 페이지 주소로 바꾼다.', '');

out.push('## 고위험군 설명 (ⓘ 바텀시트 — 출처 원문 그대로 표시해야 함)', '', '| 키 | 초안 문구 | 출처 | 원문 일치 | 대조 |', '|---|---|---|---|---|');
for (const [k, v] of Object.entries(data.info)) out.push(`| \`${k}\` | ${cell(v.text)} | \`${v.sourceId}\` | ${v.verbatim ? '원문' : '**초안 — 원문으로 교체**'} | ${box(v.reviewedAt)} |`);
out.push('');

// 항목 단위(중복 제거) 대조
const uniq = new Map();
for (const s of data.sets) for (const sec of s.sections) for (const i of sec.items) {
  const key = `${i.id}|${i.cycle}`;
  if (!uniq.has(key)) uniq.set(key, { ...i, section: sec.id, sets: [] });
  uniq.get(key).sets.push(`${s.ageGroup}/${s.sex}`);
}
out.push('## 항목별 대조 (같은 항목은 한 번만 대조)', '', '| 섹션 | ID | 항목 | 주기 | 검사 | 출처 | 확인할 점 | 쓰이는 세트 | 대조 |', '|---|---|---|---|---|---|---|---|---|');
for (const i of uniq.values()) out.push(`| ${SECTION[i.section]} | \`${i.id}\` | ${cell(i.name)} | ${cell(i.cycle)} | ${cell(i.test)} | \`${i.sourceId}\` | ${cell(i.reviewNote)} | ${i.sets.join(', ')} | ${box(i.reviewedAt)} |`);
out.push('');

out.push('## 세트별 구성 (빠진 항목·성별 조건 확인)', '');
for (const s of data.sets) {
  out.push(`### ${s.ageGroup} / ${s.sex}`, '');
  for (const sec of s.sections) {
    const names = sec.items.map((i) => [i.name, i.cycle].filter(Boolean).join(' · '));
    out.push(`- **${SECTION[sec.id]}**: ${names.length ? names.join(' / ') : '(없음)'}`);
  }
  out.push('');
}
writeFileSync(join(root, 'docs/healthData-review.md'), out.join('\n'));
console.log('docs/healthData-review.md');
