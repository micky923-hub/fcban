# 열린 질문 (운영자 결정 대기)

구현을 막지 않도록 각 항목은 **기본값으로 진행**했다. 결정되면 해당 위치만 바꾼다.
SPEC §8의 1–4번은 그대로 유효하며, 아래는 순서 0·1 작업 중 새로 생긴 질문이다.

| # | 질문 | 현재 기본값 | 바꿀 곳 |
|---|---|---|---|
| Q1 | ~~국민연금 조건 안내 문구가 1군 사전과 충돌~~ — **결정(2026-11-09): A안.** `forbidden-words.json` 화이트리스트에 해당 복합어 추가, 결과 화면에 `copy.disclaimer.pension` 표시. | 해결 | — |
| Q2 | `copy.disclaimer.general` 끝이 "확인하세요"로, CLAUDE.md 규칙 3(하세요 금지, 허브 히어로만 예외)과 맞지 않는다. 같은 맥락으로 `calendar.result.insuranceAgeInfo`("보험에서 쓰는 나이 계산법…")는 2군(warn) 단어를 단독으로 포함한다. | 확정 카피이므로 **둘 다 그대로 렌더**. | copy.ko.json 개정 여부 |
| Q3 | 기준일이 생년월일보다 이전일 때의 오류 문구가 copy에 없다. | `errors.invalidFormat`("숫자 8자리로 입력해 주세요")을 기준일 칸 아래에 표시. | copy.ko.json `calendar.errors`에 전용 문구 추가 시 `calendar.js` 교체 |
| Q4 | 화면에 필요한 보조 표기 일부가 copy에 없다: `오늘`, `생`, `기준일`, `세`, `올해`, `D-{days}`, `짝수`/`홀수`, `닫기`, `사업자 정보 ↗`, `보험나이와 상령일`(바텀시트 제목), `설명 보기`(ⓘ 버튼 접근성 라벨). | `assets/ui.js`의 `LABELS` 한 곳에 모아 둠. | 확정되면 copy.ko.json으로 이동 |
| Q5 | `ageRules.json`에 65세 나이 값과 생년월일 하한(1900-01-01)이 없어 코드에 숫자를 박게 된다. | `data/ageRules.json`에 `age65.age: 65`, `input.minBirthISO: "1900-01-01"` **두 필드를 추가**함(기존 값 변경 없음). | 운영자 확인 |
| Q6 | 65세 행 보조문 "국민연금 수령 시작 · 기초연금 신청 연령"은 연금 개시가 65세가 아닌 출생연도(1952–1968년생)에게는 맞지 않는다(C3: 64세 개시). | 개시 나이 = 65세면 전체 문구, 아니면 " · " 뒤 "기초연금 신청 연령"만 표시. 개시 나이 = 65세면 연금 행은 65세 행에 합침(C1 rowsOrder 기준). | copy 개정 시 `ageCalendar.js` |
| Q7 | 올해 검진 대상 행의 날짜는 12.31(마감)이라, 기준일이 12월 말이면 같은 해의 다른 항목(예: 12.25 65세)보다 뒤로 정렬된다. SPEC은 "해당 시 첫 행". | **항상 첫 행 고정**. 나머지는 날짜 오름차순. | — |
| Q8 | SPEC 시그니처는 `insuranceAge(birthISO, baseISO)` 인데, 6개월 상수를 코드에 박지 않으려면 rules가 필요하다. | `insuranceAge(birthISO, baseISO, rules)` — 3번째 인자로 `ageRules` 전달. | — |
| Q9 | 브라우저에서 JSON을 `import … with { type: 'json' }`로 읽으면 iOS 17.2 미만 Safari에서 페이지 전체가 열리지 않는다(50–70대 고객의 구형 기기). | `scripts/sync-data.mjs`가 `data/*.json` → `assets/*.json` 복사본과 함께 `assets/*.data.js`(ES 모듈)를 생성하고, 화면은 `.data.js`를 import. 일치 여부는 `tests/data-sync.test.mjs`가 검사. | data 수정 후 `npm run sync` |
| Q10 | 카카오 JS SDK의 정확한 버전·SRI 해시, 채널 홈 주소, 공유 썸네일 URL, 사업자 정보 페이지 주소. | `assets/config.js`에 SDK URL(2.7.4, 버전 확인 필요)만 두고 나머지는 빈 값 → 공유·채널 추가 버튼 비활성. 사업자 정보는 임시로 bluem-partners.com. | `assets/config.js` |
| Q11 | 기존 사이트처럼 허브 헤더에 로고만 둘지, 도구 화면 헤더를 "← 도구 이름"으로 할지. | PNG 기준: 허브는 "파이낸셜 다이어리", 도구 화면은 "← 내 나이 달력"(탭하면 허브). | — |
