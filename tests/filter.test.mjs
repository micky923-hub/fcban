// 금지어·근거 검사기(SB-12): 화이트리스트 우선, 1·2군, 근거, 필수 요건, CLI exit code, 빌드 연동
// 1군 단어는 이 파일에 직접 쓰지 않는다 — 실행 중 사전에서 꺼낸다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT, readJSON } from './_load.mjs';
import { checkText, checkJSONStrings, EXIT } from '../ops/filter/core.mjs';
import { checkText as nodeCheck } from '../ops/filter/filter.mjs';

const dict = readJSON('data/forbidden-words.json');
const sources = readJSON('ops/sources/index.json');
const copy = readJSON('data/copy.ko.json');
const ctx = { dict, sources, copy, endingExceptions: [copy.hub.hero] };
const ui = (t) => checkText(t, { ...ctx, mode: 'ui' });
const content = (t) => checkText(t, ctx);
const T1 = dict.tier1_block.words;
const tiers = (r) => r.findings.map((f) => f.tier);
const SAMPLE = readFileSync(join(ROOT, 'tests/fixtures/newsletter/sample.md'), 'utf8');

test('화이트리스트가 1·2군 부분 일치보다 우선한다', () => {
  for (const w of dict.whitelist.words) assert.equal(ui(`${w}입니다.`).verdict, 'pass', w);
  assert.equal(ui('국민연금 가입기간 10년 이상 조건이 있습니다.').verdict, 'pass');
  assert.equal(ui('보험나이 53세 → 54세').verdict, 'pass');
});

test('1군: 단어·상품 패턴은 block', () => {
  for (const w of T1) {
    const r = ui(`이 문장에는 ${w} 이 들어 있습니다.`);
    assert.equal(r.verdict, 'block', w);
    assert.ok(r.findings.some((f) => f.tier === '1' && f.word === w), w);
  }
  assert.equal(ui(`${'실손'}${'보험'} 안내입니다.`).verdict, 'block');
  assert.equal(ui(`${'건강'}${'보험'} 이야기입니다.`).verdict, 'block');
  assert.equal(ui('국민건강보험공단 안내입니다.').verdict, 'pass', '화이트리스트');
});

test('2군: 경고(warn), 1군과 겹치면 1군만', () => {
  const r = ui('자세한 내용은 상담으로 확인합니다.');
  assert.equal(r.verdict, 'warn');
  assert.deepEqual(tiers(r), ['2']);
  assert.equal(ui('보험에서 쓰는 나이입니다.').verdict, 'warn');
  assert.equal(ui('FCP 지표입니다.').verdict, 'pass', '영문 단어는 낱말 경계');
  const both = ui(`${T1[3]} 안내입니다.`); // 1군 단어가 2군 '보험'을 포함
  assert.deepEqual(tiers(both), ['1']);
});

test('권유형 어미: 경고, 허브 히어로만 예외', () => {
  assert.equal(ui('미리 준비하세요.').verdict, 'warn');
  assert.equal(ui('미리 준비하세요.').findings.filter((f) => f.tier === 'ending').length, 1, "'하세요' 중복 없음");
  assert.equal(ui(copy.hub.hero).verdict, 'pass');
  assert.equal(ui('확인할 수 있습니다.').verdict, 'pass');
});

test('근거 검사: 수치·기준 문장에 출처 ID 가 없으면 block', () => {
  const md = (body) => `---\ncategory: estate\ndisclaimer: tax\n---\n\n${body}\n\n::: sources\n- [S-TAX-01] 국세청 상속세 안내\n:::\n`;
  assert.equal(content(md('일괄공제는 5억 원입니다.')).verdict, 'block');
  assert.equal(content(md('일괄공제는 5억 원입니다 [S-TAX-01].')).verdict, 'pass');
  assert.equal(content(md('세율은 구간마다 다릅니다. 최고 세율은 50%입니다. 자세한 내용은 국세청 안내에 있습니다 [S-TAX-01].')).verdict, 'pass', '문단 끝 출처 ID');
  const unknown = content(md('일괄공제는 5억 원입니다 [S-TAX-99].'));
  assert.equal(unknown.verdict, 'block');
  assert.ok(unknown.findings.some((f) => f.tier === 'evidence' && f.sourceId === 'S-TAX-99'), '라이브러리에 없는 ID');
  const ev = content(md('검진은 2년마다 받습니다.\n\n대상은 20세 이상입니다.')).findings.filter((f) => f.tier === 'evidence');
  assert.equal(ev.length, 2);
  assert.deepEqual(ev.map((f) => f.location.paragraph), [2, 3]);
});

test('필수 요건: 출처·고지문·바이라인·건강 글 결론', () => {
  const noSrc = content('---\ncategory: life\ndisclaimer: general\n---\n\n정보 문장입니다.\n');
  assert.equal(noSrc.verdict, 'block');
  assert.equal(noSrc.required.source, false);
  const plain = content('정보 문장입니다. https://www.nts.go.kr/');
  assert.equal(plain.required.disclaimer, false);
  assert.equal(plain.required.byline, false);
  assert.equal(content(`정보 문장입니다. https://www.nts.go.kr/\n\n${copy.brand.byline}\n\n${copy.disclaimer.general}`).required.byline, true);
  const fear = content('---\ncategory: health\ndisclaimer: general\n---\n\n검진 항목 설명입니다 [S-HLT-01].\n\n미리 대비해 두는 것이 중요합니다.\n\n::: sources\n- [S-HLT-01] 국민건강보험공단\n:::\n');
  assert.equal(fear.required.noFear, false);
  assert.ok(fear.findings.some((f) => f.rule === 'REQ-NO-FEAR'));
});

test('SB-12 예시 문장: 1군·근거·2군 모두 검출 → block', () => {
  const t = `---\ncategory: estate\ndisclaimer: tax\n---\n\n상속공제는 크게 일괄공제 5억 원과 배우자공제로 나뉩니다. 배우자가 있다면 최소 10억 원까지는 세금이 생기지 않는 구간입니다. 그 이상이라면 ${T1[6]}이 필요할 수 있고, 미리 상담을 받아두면 좋습니다.\n\n::: sources\n- [S-TAX-01] 국세청 상속세 안내\n:::\n`;
  const r = content(t);
  assert.equal(r.verdict, 'block');
  assert.ok(r.findings.some((f) => f.tier === '1' && f.word === T1[6]));
  assert.ok(r.findings.some((f) => f.tier === '2' && f.word === '상담'));
  assert.ok(r.findings.some((f) => f.tier === 'evidence' && f.sentence.includes('10억 원')));
  const f1 = r.findings.find((f) => f.tier === '1');
  assert.equal(t.slice(f1.start, f1.end), T1[6], '위치(start/end)가 원문과 맞음');
  assert.equal(f1.location.line, 6); // front matter 4줄 + 빈 줄 다음
});

test('예시 원고(테스트용)는 pass', () => {
  const r = nodeCheck(SAMPLE);
  assert.deepEqual(r.findings, []);
  assert.equal(r.verdict, 'pass');
  assert.deepEqual(r.required, { source: true, disclaimer: true, byline: true, noFear: true });
});

test('사이트 카피 전체(copy.ko.json): 1군 0건', () => {
  const r = checkJSONStrings(copy, ctx);
  assert.equal(r.findings.filter((f) => f.tier === '1').length, 0);
  assert.notEqual(r.verdict, 'block');
});

test('CLI exit code: 0 pass / 1 warn / 2 block', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fd-filter-'));
  const run = (name, text, ...flags) => {
    const p = join(dir, name);
    writeFileSync(p, text);
    return spawnSync(process.execPath, [join(ROOT, 'ops/filter/cli.mjs'), p, ...flags], { encoding: 'utf8' });
  };
  const pass = spawnSync(process.execPath, [join(ROOT, 'ops/filter/cli.mjs'), join(ROOT, 'tests/fixtures/newsletter/sample.md')], { encoding: 'utf8' });
  assert.equal(pass.status, EXIT.pass, pass.stderr);
  assert.equal(JSON.parse(pass.stdout).verdict, 'pass');
  assert.equal(run('w.txt', '상담 안내입니다.', '--ui').status, EXIT.warn);
  const b = run('b.txt', `${T1[0]} 안내입니다.`, '--ui');
  assert.equal(b.status, EXIT.block);
  assert.equal(JSON.parse(b.stdout).results[0].findings[0].tier, '1');
  assert.equal(spawnSync(process.execPath, [join(ROOT, 'ops/filter/cli.mjs'), join(ROOT, 'data/copy.ko.json')]).status, EXIT.warn);
  assert.equal(spawnSync(process.execPath, [join(ROOT, 'ops/filter/cli.mjs')]).status, 64);
  rmSync(dir, { recursive: true });
});

test('빌드 연동: build.mjs 가 ops/filter 를 불러오고, block 원고면 빌드 실패', async () => {
  const { loadFilter, build } = await import('../scripts/build.mjs');
  const filter = await loadFilter();
  assert.equal(typeof filter, 'function');
  const { mkdirSync, copyFileSync } = await import('node:fs');
  const dir = mkdtempSync(join(tmpdir(), 'fd-build-filter-'));
  mkdirSync(join(dir, 'content'));
  copyFileSync(join(ROOT, 'index.html'), join(dir, 'index.html'));
  writeFileSync(join(dir, 'content', 'a.md'), SAMPLE);
  assert.equal(build({ root: dir, contentDir: join(dir, 'content'), today: '2026-11-12', filter }).ok, true);
  writeFileSync(join(dir, 'content', 'a.md'), SAMPLE.replace('구조입니다.', `구조입니다. ${T1[6]} 안내입니다.`));
  const r = build({ root: dir, contentDir: join(dir, 'content'), today: '2026-11-12', filter });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(), /block/);
  rmSync(dir, { recursive: true });
});

test('ops/ 폴더: 콘텐츠 폴더 5개 + 코드 폴더(filter·review)만, 고객 폴더 없음', () => {
  const allowed = new Set(['sources', 'drafts', 'approved', 'published', 'logs', 'filter', 'review']);
  for (const name of readdirSync(join(ROOT, 'ops'))) {
    if (statSync(join(ROOT, 'ops', name)).isDirectory()) assert.ok(allowed.has(name), name);
  }
});

test('소스 색인: ID 형식·중복 없음·주제 4종', () => {
  const ids = sources.sources.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const s of sources.sources) {
    assert.match(s.id, new RegExp(`^${dict.evidence_check.sourceIdPattern.replace(/\\\[|\\\]/g, '')}$`));
    assert.ok(['health', 'tax', 'age', 'dongui'].includes(s.topic), s.id);
  }
});
