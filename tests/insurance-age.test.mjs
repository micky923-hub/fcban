// tests/insurance-age.cases.json (12건)을 그대로 읽어 검사한다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readJSON } from './_load.mjs';
import { insuranceAge } from '../assets/ageCalendar.js';

const rules = readJSON('data/ageRules.json');
const { cases } = readJSON('tests/insurance-age.cases.json');

test('케이스 파일은 12건이다', () => assert.equal(cases.length, 12));

for (const c of cases) {
  test(`#${c.id} ${c.note} (${c.birth} @ ${c.base})`, () => {
    const r = insuranceAge(c.birth, c.base, rules);
    assert.deepEqual(r, { fullAge: c.fullAge, insAge: c.insAge, nextChangeISO: c.nextChange });
  });
}
