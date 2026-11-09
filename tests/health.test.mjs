// 내 나이 건강 체크(SB-05/06): healthData.json 초안 구조·출처·금지 표현, 화면 모델, 나이대 전달
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readJSON } from './_load.mjs';
import { healthModel, isDraftSet, isDraftData, findSet } from '../assets/health.js';
import { ageGroupFor, setAgeGroupHandoff, takeAgeGroupHandoff } from '../assets/handoff.js';
import { tier1Hits } from './forbidden-guard.test.mjs';

const data = readJSON('assets/healthData.json');
const copy = readJSON('data/copy.ko.json');
const dict = readJSON('data/forbidden-words.json');
const allItems = data.sets.flatMap((s) => s.sections.flatMap((sec) => sec.items.map((i) => ({ ...i, set: s, section: sec.id }))));

test('12세트 = 나이대 6 × 성별 2, 중복 없음', () => {
  assert.equal(data.ageGroups.length, 6);
  assert.equal(data.sexes.length, 2);
  assert.equal(data.sets.length, 12);
  for (const g of data.ageGroups) for (const s of data.sexes) {
    assert.equal(data.sets.filter((x) => x.ageGroup === g.id && x.sex === s.id).length, 1, `${g.id}/${s.id}`);
  }
});

test('칩 라벨이 확정 카피와 같은 순서·같은 글자', () => {
  assert.deepEqual(data.ageGroups.map((g) => g.label), copy.health.ageOptions);
  assert.deepEqual(data.sexes.map((s) => s.label), copy.health.sexOptions);
});

test('섹션 3개 고정 순서: 국가건강검진 → 국가암검진 → 흔히 챙기는 것(최대 limits.commonMax)', () => {
  assert.equal(data.limits.commonMax, 7, '운영자 결정 2026-11-09 (3→4→5→7)');
  for (const s of data.sets) {
    assert.deepEqual(s.sections.map((x) => x.id), ['general', 'cancer', 'common']);
    assert.ok(s.sections[2].items.length <= data.limits.commonMax, `${s.ageGroup}/${s.sex}`);
  }
});

test('모든 항목에 sourceId(출처표에 있음)와 reviewedAt 키가 있다', () => {
  for (const i of allItems) {
    assert.ok(i.sourceId in data.sources, `${i.id} sourceId`);
    assert.ok('reviewedAt' in i, `${i.id} reviewedAt`);
    assert.ok(i.reviewedAt === null || /^\d{4}-\d{2}-\d{2}$/.test(i.reviewedAt), `${i.id} reviewedAt 형식`);
  }
  for (const [k, v] of Object.entries(data.info)) {
    assert.ok(v.sourceId in data.sources, `info ${k}`);
    assert.ok('reviewedAt' in v, `info ${k}`);
  }
  for (const i of allItems.filter((x) => x.infoId)) assert.ok(i.infoId in data.info, i.infoId);
});

test('성별 조건: 남성 세트에 여성 전용 암검진이 없다', () => {
  for (const s of data.sets.filter((x) => x.sex === 'male')) {
    const ids = s.sections[1].items.map((i) => i.id);
    assert.ok(!ids.includes('ca-breast') && !ids.includes('ca-cervix'), s.ageGroup);
  }
});

test('수치 기준·위험도·판정·권유형 어미가 없다', () => {
  const text = JSON.stringify({ sets: data.sets, info: data.info });
  for (const bad of [/mg\/dL/i, /mmHg/i, /\d\s*%/, /위험도/, /판정/, /정상\s*범위/, /당신/]) assert.ok(!bad.test(text), String(bad));
  for (const e of dict.ux_writing.forbiddenEndings) assert.ok(!text.includes(e), e);
  assert.deepEqual(tier1Hits(JSON.stringify(data)), []);
});

test('초안 배지: 운영자 확정(2026-11-10) 후 해제, 한 항목이라도 reviewedAt 이 비면 다시 초안', () => {
  assert.equal(data._meta.status, 'confirmed');
  for (const s of data.sets) assert.equal(isDraftSet(data, s), false, `${s.ageGroup}/${s.sex}`);
  const reopened = structuredClone(data);
  reopened.sets[0].sections[0].items[0].reviewedAt = null;
  assert.equal(isDraftSet(reopened, reopened.sets[0]), true, '고친 항목은 다시 확정 전까지 초안');
  const confirmed = structuredClone(data);
  confirmed._meta.status = 'draft';
  assert.equal(isDraftSet(confirmed, findSet(confirmed, '50s', 'male')), true, 'status 가 draft 면 초안');
  confirmed._meta.status = 'confirmed';
  for (const v of Object.values(confirmed.info)) v.reviewedAt = null;
  assert.equal(isDraftSet(confirmed, findSet(confirmed, '50s', 'male')), true, '고위험군 설명 reviewedAt 이 비면 초안');
  for (const v of Object.values(confirmed.info)) v.reviewedAt = '2026-11-10';
  assert.equal(isDraftSet(confirmed, findSet(confirmed, '50s', 'male')), false);
});

test('화면 모델: 50대 남성', () => {
  const m = healthModel(data, copy, '50s', 'male');
  assert.equal(m.summary, '50대 · 남성');
  assert.deepEqual([m.general.title, m.cancer.title, m.common.title], copy.health.result.sections);
  assert.deepEqual(m.cancer.items.map((c) => c.name), ['위암', '대장암', '간암', '폐암']);
  assert.ok(m.cancer.items.find((c) => c.name === '간암').info);
  assert.equal(m.draft, false, '운영자 확정 후 초안 배지 없음');
  assert.equal(healthModel(data, copy, 'x', 'male'), null);
});

test('만 나이 → 나이대', () => {
  const g = data.ageGroups;
  assert.equal(ageGroupFor(19, g), null);
  assert.equal(ageGroupFor(20, g), '20s');
  assert.equal(ageGroupFor(52, g), '50s');
  assert.equal(ageGroupFor(69, g), '60s');
  assert.equal(ageGroupFor(70, g), '70plus');
  assert.equal(ageGroupFor(104, g), '70plus');
  assert.equal(ageGroupFor(null, g), null);
});

test('나이대 전달은 1회용이고 허용 ID 만 받는다', () => {
  const mem = new Map();
  globalThis.sessionStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
  const ids = data.ageGroups.map((x) => x.id);
  setAgeGroupHandoff('50s');
  assert.equal(takeAgeGroupHandoff(ids), '50s');
  assert.equal(takeAgeGroupHandoff(ids), null, '읽은 뒤 지워짐');
  mem.set('fd.handoff.ageGroup', '1974-02-03');
  assert.equal(takeAgeGroupHandoff(ids), null);
  assert.equal(mem.size, 0);
  delete globalThis.sessionStorage;
  assert.equal(takeAgeGroupHandoff(ids), null, '저장소 없는 환경');
});

test('건강 체크 head 의 공유 미리보기 문구가 확정 카피와 같다', () => {
  const html = readFileSync(join(ROOT, 'health/index.html'), 'utf8');
  assert.ok(html.includes(`content="${copy.health.share}"`));
  assert.ok(html.includes(`content="${copy.health.title}"`));
});

test('출처 대조표가 모든 세트·항목을 담고 있다', () => {
  const md = readFileSync(join(ROOT, 'docs/healthData-review.md'), 'utf8');
  for (const s of data.sets) assert.ok(md.includes(`${s.ageGroup} / ${s.sex}`), `${s.ageGroup}/${s.sex}`);
  for (const id of new Set(allItems.map((i) => i.id))) assert.ok(md.includes(`\`${id}\``), id);
});

test('1차 대조(firstPass) 형식과 운영자 확정 기록', () => {
  const ok = new Set(['match', 'differs', 'notFound']);
  for (const i of allItems) {
    assert.ok(i.firstPass && ok.has(i.firstPass.status), `${i.id} firstPass`);
    assert.match(i.firstPass.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    if (i.firstPass.status === 'differs') assert.ok(i.firstPass.proposal, `${i.id} 다름이면 바꿀 제안 필요`);
  }
  for (const v of Object.values(data.info)) assert.ok(v.firstPass && ok.has(v.firstPass.status));
  // 확정은 운영자만: 모든 항목·고위험군·출처에 운영자 확인일이 있다
  assert.ok(allItems.every((i) => i.reviewedAt === '2026-11-10'));
  assert.ok(Object.values(data.info).every((v) => v.reviewedAt === '2026-11-10' && v.verbatim === true));
  assert.ok(Object.values(data.sources).every((v) => v.checkedAt === '2026-11-10'));
  for (const m of data._meta.firstPass.missingFromDraft) assert.ok(m.sourceId in data.sources, m.name);
});

test('출처 카드 배지(데이터 전체): 확정이면 없음, 어느 세트든 비면 초안', () => {
  assert.equal(isDraftData(data), false);
  const r = structuredClone(data);
  r.sets[11].sections[2].items[0].reviewedAt = null;
  assert.equal(isDraftData(r), true);
  assert.equal(isDraftData({ ...data, _meta: { ...data._meta, status: 'draft' } }), true);
  const src = readFileSync(join(ROOT, 'health/health.js'), 'utf8');
  assert.ok(!/isDraftSet\(data, null\)/.test(src), '세트 없이 isDraftSet 을 부르지 않는다(항상 초안이 됨)');
});
