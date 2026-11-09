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
| Q12 | 허브가 `content/weekly.json`을 실행 중에 요청(fetch)할지, 빌드 때 심을지. SPEC은 "서버 호출 없음 · LCP 1.5초". | **빌드 때 심음.** `scripts/inline-weekly.mjs`가 `index.html`의 `<script type="application/json" id="weekly-data">`에 넣는다. 비어 있거나 형식이 틀리면 영역 숨김. 순서 5의 `build.mjs`가 이 스크립트를 호출하도록 연결 예정. | 순서 5 |
| Q13 | sb-07의 "이번 주 다이어리" 오른쪽 날짜(“11월 2…”로 잘려 보임)의 형식과 데이터 필드. SPEC의 weekly.json 필드(title, slug, donguiLine, readMin)에는 날짜가 없다. | 선택 필드 `publishedAt`(YYYY-MM-DD)을 받으면 "11월 12일"로 표시, 없으면 생략. 표기 `{m}월 {d}일`은 `LABELS.monthDay`(Q4와 같이 copy 이동 대상). | 순서 5 weekly.json 스키마 |
| Q14 | 허브 히어로 `copy.hub.hero`는 한 줄 문자열인데 PNG는 두 줄("내 삶의 숫자를 / 쉽게 확인하세요"). | copy는 그대로 두고 제목 폭(7.6em)으로 두 줄 줄바꿈. | copy에 `\n` 넣을지 |
| Q15 | 허브의 건강 체크·상속·증여 카드와 달력의 "건강 체크 →"는 순서 3·4 전까지 404. | 링크는 그대로 둠(경로 고정: `health/`, `estate/`). | 순서 3·4 |
| Q16 | **건강 데이터 초안의 정확성.** 초안 작성자는 국민건강보험공단·국립암센터 원문을 직접 열람하지 않았다. 특히 2025년 개정 가능 항목(정신건강검사 청년 주기, 골밀도 대상 연령, C형간염 검사 추가 여부), 국가암검진 연령 상한, 폐암 고위험군 흡연력 기준. | 전 항목 `reviewedAt: null`, `_meta.status: "draft"` → 화면 '초안' 배지. **확정 전 배포 금지.** | `docs/healthData-review.md` 체크표로 대조 |
| Q17 | sb-12는 '흔히 챙기는 것'을 "국가검진 외 항목"(예: 안과 검진)으로 설명하지만, 프롬프트 3은 출처를 국민건강보험공단·국립암센터로 한정한다. 국가검진 외 항목은 이 두 출처에 근거가 없다. PNG 예시의 한 항목은 2군 단어를 포함한다. | 일반건강검진의 **성·연령별 추가 검사**(이상지질혈증·골밀도·인지기능 등)를 넣음 — 출처 ID 부착 가능. | 운영자가 항목 범위와 추가 출처를 결정 |
| Q18 | 고위험군 ⓘ 설명은 "출처 원문 그대로"여야 하는데 원문이 저장소에 없다. | 초안 문구에 `verbatim: false` 표시. 대조표에 "원문으로 교체" 표시. | `healthData.json` `info.*.text` |
| Q19 | 달력 → 건강 체크 나이대 자동 선택은 "세션 메모리"인데, 페이지가 바뀌면 메모리가 사라진다. | `sessionStorage`에 나이대 ID(예: `50s`)만 1회 저장 → 건강 체크가 읽는 즉시 삭제. 생년월일·만 나이는 넘기지 않음. 접근은 `assets/handoff.js` 한 곳(테스트로 강제). localStorage 미사용. | 허용 여부 확인 |
| Q20 | 국가암검진 대상이 없는 나이대(20·30대 남성) 안내 문구가 copy에 없다. | `LABELS.noCancerScreening` "이 나이대의 국가암검진 항목은 없습니다." (Q4와 같이 copy 이동 대상). 같은 이유로 `LABELS.draft` '초안'. | copy.ko.json |
| Q21 | `healthData.json` 위치: SPEC은 `assets/`, CLAUDE.md는 상수를 `data/`에서만 읽으라고 한다. | SPEC대로 `assets/healthData.json`을 원본으로 두고, 브라우저용 `assets/healthData.data.js`를 `npm run sync`로 생성. | — |
