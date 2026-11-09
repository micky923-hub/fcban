# Claude Code 착수 프롬프트

아래 순서로 준비한 뒤, 프롬프트를 그대로 붙여 넣는다.

## 준비 (운영자)

1. 새 폴더를 만들고 이 패키지 내용을 복사한다. 예: `~/dev/financial-diary/`
   - `CLAUDE.md`는 저장소 루트에 둔다.
   - `docs/`, `data/`, `tests/`는 그대로 둔다.
2. `git init` 후 첫 커밋(`chore: handoff package v1.3`).
3. (선택) GitHub 저장소 생성·연결. `ops/`는 나중에 비공개 저장소로 분리해도 된다.
4. 카카오 디벨로퍼스 JS 앱 키는 있으면 준비, 없으면 비워 둔다(공유 버튼만 비활성).

## 프롬프트 1 — 첫 세션 (토큰 + 내 나이 달력)

```
이 저장소의 CLAUDE.md와 docs/SPEC.md를 먼저 끝까지 읽어라. 그다음 docs/storyboard/sb-06.png(공통 레이아웃), sb-07.png(허브), sb-08.png, sb-09.png, sb-10.png(내 나이 달력)을 열어 화면을 확인해라.

작업 범위는 SPEC §7의 순서 0과 1이다.
- 순서 0: assets/base.css 디자인 토큰, assets/ui.js 공통 컴포넌트(헤더·푸터·고지문·공유·채널 추가·오류 문구). 카피는 data/copy.ko.json을 assets/로 복사해 import 한다.
- 순서 1: assets/ageCalendar.js에 insuranceAge()와 ageCalendar()를 순수 함수로 구현하고, tests/insurance-age.cases.json(12건)과 tests/age-calendar.cases.json을 그대로 읽는 node:test 러너를 만들어 전부 통과시켜라. 그다음 calendar/index.html을 sb-08/09.png대로 만든다(입력 → 같은 페이지 결과 전환, 서버 호출 0, localStorage 미사용).

규칙: 의존성 추가 금지, 날짜는 'YYYY-MM-DD' 문자열 연산만, 상수는 data/ageRules.json에서만. 1군 금지어(data/forbidden-words.json)는 어디에도 쓰지 마라. 모르는 것은 docs/OPEN_QUESTIONS.md에 적고 기본값으로 진행해라.

끝나면 멈추고 보고해라: 변경 파일 목록, npm test 결과, 390px 뷰포트 스크린샷(입력·결과 두 장). 내가 확인한 뒤 순서 2(허브)로 간다.
```

## 프롬프트 2 — 이후 세션 (순서 N)

```
CLAUDE.md와 docs/SPEC.md를 다시 읽어라. 이전 순서는 완료·승인됐다. 이번 범위는 SPEC §7의 순서 N이다. 해당 PNG(docs/storyboard/)를 먼저 보고, 완료 조건을 만족시킨 뒤 멈추고 보고해라(변경 파일, 테스트 결과, 스크린샷).
```

## 프롬프트 3 — 건강 데이터 초안 (순서 3 전)

```
assets/healthData.json 초안을 만들어라. 구조: ageGroup(20대~70대+) × sex(male/female) 12세트, 각 세트에 sections[국가건강검진, 국가암검진, 흔히 챙기는 것] 과 items[{name, cycle, test, sourceId, reviewedAt:null}]. 출처는 국민건강보험공단 건강검진 안내와 국립암센터 암검진 권고안만 사용하고, 각 항목에 sourceId를 붙여라. 수치 기준·위험도·판정 문구는 넣지 마라. 모든 reviewedAt은 null로 두고, 내가 출처와 대조해 확정할 수 있도록 docs/healthData-review.md에 항목별 체크표를 함께 만들어라.
```

## 보고 받을 때 확인할 것 (운영자 체크)

- [ ] 1군 금지어가 UI·코드·주석에 없다 (`node ops/filter/cli.mjs`로 확인 가능해지기 전엔 grep)
- [ ] 서버로 보내는 fetch/XHR/form submit이 없다
- [ ] 결과 화면 큰 숫자는 하나(만 나이), 보조 CTA는 텍스트+화살표
- [ ] 테스트 전부 통과, 실기기(아이폰·갤럭시)에서 390px 확인
- [ ] 고지문이 접히지 않고 보인다
