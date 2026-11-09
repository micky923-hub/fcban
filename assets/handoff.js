// 내 나이 달력 → 건강 체크로 넘어갈 때 '나이대' 하나만 넘긴다 (SPEC SB-05: 세션 메모리, URL 파라미터 금지).
// - 넘기는 값은 나이대 ID(예: '50s') 뿐. 생년월일·만 나이·결과값은 넘기지 않는다.
// - 탭을 닫으면 사라지는 sessionStorage 를 쓰고, 건강 체크가 읽는 즉시 지운다(1회용).
// - 저장소 접근은 이 파일에서만 한다(tests 가 다른 파일의 사용을 막는다). localStorage 는 쓰지 않는다.
const KEY = 'fd.handoff.ageGroup';

/** 만 나이 → 나이대 ID. 범위 밖(20세 미만 등)이면 null */
export function ageGroupFor(age, groups) {
  if (!Number.isInteger(age)) return null;
  const g = groups.find((x) => age >= x.minAge && (x.maxAge === null || age <= x.maxAge));
  return g ? g.id : null;
}

export function setAgeGroupHandoff(id) {
  try {
    if (id) sessionStorage.setItem(KEY, id);
    else sessionStorage.removeItem(KEY);
  } catch { /* 저장 불가 환경: 자동 선택만 생략 */ }
}

/** 읽고 바로 지운다. 허용된 ID 가 아니면 null */
export function takeAgeGroupHandoff(validIds) {
  try {
    const v = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return validIds.includes(v) ? v : null;
  } catch {
    return null;
  }
}
