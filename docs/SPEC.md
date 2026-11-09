# 파이낸셜 다이어리 — 1단계 구현 명세 (SPEC)

- 버전: 스토리보드 v1.3 (2026-11-09, 승인본) 기준
- 운영 주체: 블루엠파트너스 (대표 반동수) — 신한라이프 FC 신분과 완전 분리
- 근거 문서: 기획서·기능명세서(Claude Doc), 스토리보드 PDF(`docs/storyboard_v1.3.pdf`), 장별 PNG(`docs/storyboard/sb-NN.png`)
- 이 문서가 코드와 다르면 **이 문서가 맞다.** 이 문서가 스토리보드 PNG와 다르면 **PNG(화면)가 맞다.**

---

## 0. 절대 원칙 (위반 시 어떤 기능도 구현하지 않는다)

| # | 원칙 | 구현 규칙 |
|---|---|---|
| P1 | 보험사·상품·보장·가입 권유 **무언급** | `data/forbidden-words.json` 1군 단어가 사이트 UI·콘텐츠 어디에도 없다. 신한라이프 로고·FC 소개·상품명·보험료·"가입" 금지. 바이라인은 "파이낸셜 다이어리 운영자 반동수"(직함·소속 없음) |
| P2 | 고객 개인정보 **서버 무보관** | 입력 폼 → 서버 전송 **0건**. 모든 계산은 브라우저 안에서. 공용 URL만(개인 식별 파라미터 금지). 방문 통계는 익명 페이지뷰만. 쿠키는 세션 한정 |
| P3 | **정보성 콘텐츠만** | '상담하세요', '준비하세요', '대비' 같은 유도 문구 금지. 어미 '~입니다/~합니다'. 건강 글은 "위험 강조 → 대비 권유" 구조 금지 |
| P4 | 발행은 **운영자 승인 클릭**으로만 | AI는 초안·개요만 만든다. 크론·자동 발행 경로 금지. 승인 로그(콘텐츠 ID·시각·승인자·필터 결과) 필수 |

> 의심스러우면 만들지 말고 `docs/OPEN_QUESTIONS.md`에 적고 다음으로 넘어간다.

---

## 1. 기술 선택

- 프레임워크 없는 **정적 HTML + Vanilla JS(ES2020) + CSS**. 의존성 0. 빌드는 Node 스크립트 1개(`scripts/build.mjs`: 마크다운 글 → 정적 HTML, 최신 글 JSON 생성).
- 호스팅: GitHub Pages(고객 화면). 운영자 화면(`ops/`)은 맥북 서버 로컬 Node/Express + Tailscale 내부망 전용, **저장소 분리 또는 비공개**.
- 외부 스크립트: 카카오 JS SDK **1개만**(공유·채널 추가), 지연 로드. 웹폰트 없음 — `Pretendard` 설치 시 사용, 없으면 system-ui 스택.
- 서비스워커 `sw.js`: 도구 3개 오프라인 캐시(SB-13).
- 테스트: Node 내장 `node:test`. `tests/*.cases.json`을 그대로 읽어 자동화.

### 파일 구조

```
financial-diary/
├─ index.html                 # SB-01 허브
├─ calendar/index.html        # SB-02/03 내 나이 달력
├─ health/index.html          # SB-05/06 내 나이 건강 체크
├─ estate/index.html          # SB-07/08 상속·증여 간이 계산
├─ diary/{slug}/index.html    # SB-09 뉴스레터 글 (빌드 시 정적 생성)
├─ 404.html                   # SB-13
├─ assets/
│   ├─ base.css               # 디자인 토큰(§2) — 색·글꼴·간격은 여기서만
│   ├─ ui.js                  # 공통 컴포넌트: 헤더·푸터·고지·공유·채널추가·오류 문구
│   ├─ ageCalendar.js         # insuranceAge + checkup + pension + age65 순수 함수
│   ├─ estate.js              # 상속·증여 간이 계산 순수 함수
│   ├─ ageRules.json          # ← data/ageRules.json 복사
│   ├─ taxRules.json          # ← data/taxRules.json 복사
│   ├─ copy.ko.json           # ← data/copy.ko.json 복사 (확정 카피)
│   └─ healthData.json        # 나이대×성별 12세트 (출처 대조표 포함)
├─ content/                   # 글 원고(markdown) + weekly.json(허브용 최신 글 1건)
├─ sw.js
├─ scripts/build.mjs
├─ tests/                     # ← tests/*.cases.json + 러너
└─ ops/                       # 운영자 (내부망 전용, 비공개)
    ├─ sources/               # F4-0 주제별 소스 라이브러리 + index.json(출처 ID)
    ├─ review/                # SB-11 대기열·개요 선승인·모바일 뷰
    └─ filter/                # SB-12 금지어·근거 검사기 (CLI + 웹)
```

---

## 2. 디자인 토큰 (base.css) — 블루엠파트너스 아이덴티티

| 토큰 | 값 | 용도 |
|---|---|---|
| `--c-primary` | `#0C2340` | bluem-partners.com theme-color와 동일. 버튼·제목·로고 |
| `--c-accent` | `#2F6FED` | 번호 배지·링크 화살표·D-day 배지에만 |
| `--c-tint` | `#EEF3F9` | 결과 카드·섹션 배경 |
| `--c-ink` | `#0F1A2B` | 본문 |
| `--c-muted` | `#5B6B7F` | 라벨·보조 |
| `--c-line` | `#D3DCE8` | 테두리·구분선 |
| `--c-error` | `#C94F3D` | 입력 오류 전용 |
| `--c-kakao` | `#FEE500` | 카카오 버튼 전용 (텍스트 `#0F1A2B`) |
| `--c-bg-soft` | `#F5F7FA` | 보조 배경 |

- 글꼴: 페이지 제목 22px/700 · 결과 수치 40px/800(한 화면 1개) · 본문 **16px 이상** · 라벨 13px · 고지문 12px(숨기지 않음).
- 모서리 6px. 터치 영역 44×44px 이상, 칩 간격 8px. 대비 4.5:1 이상. 다크모드 1단계 제외.
- 헤더: **흰 배경 + 네이비 텍스트 로고 "파이낸셜 다이어리" + 하단 헤어라인**(짙은 색 바 금지). 뒤로가기는 `←`.
- CTA: 주 버튼 1개(네이비 채움) + 보조는 **텍스트 + 화살표**(내부 `→`, 외부 `↗`). 사이트의 "문의하기 →" 관행과 통일.
- 뷰포트: 모바일 우선 360–430px, 데스크톱은 중앙 정렬 최대 640px.

---

## 3. 공통 레이아웃 (모든 고객 화면)

1. 헤더(위) — 탭하면 허브.
2. 콘텐츠 — 좌우 여백 20px, 한 화면 = 한 도구, 스크롤 2화면 이내.
3. 고지문 — `copy.disclaimer.general`(건강·달력) / `copy.disclaimer.tax`(상속·증여). 접지 않는다.
4. 공유(카카오) · 채널 추가 — 공유 메시지는 **고정 문구 + 공용 URL + 고정 썸네일**, 개인 결과값 미포함. 채널 추가 = 카카오 채널 홈 링크.
5. "다른 도구 보기 →" — 허브로.
6. 푸터 — `copy.brand.footer` + `bluem-partners.com ↗` + 사업자 정보 페이지 링크.

---

## 4. 화면 명세

### SB-01 허브 `/`  (PNG: sb-07)
- 히어로 `copy.hub.hero` + `copy.hub.sub`(삭제 금지).
- **이번 주 다이어리(최상단 고정)**: `content/weekly.json`에서 최신 글 1건 — 제목(2줄 말줄임) · 동의보감 한 줄 인용 · "읽는 시간 N분 →". 글이 없으면 영역 자체를 숨긴다(빈 카드 금지).
- **올해 알아둘 숫자**(2026-11-09 추가, Q60): `copy.hub.numbersLabel` + 2열 카드. `assets/hub.js` `yearNumbers()`가 브라우저 로컬 연도와 확정 데이터만으로 계산한다(개인 입력 없음). 순서 고정 — 국가건강검진 대상(홀짝, `ageRules.healthCheckup`) → 올해 국민연금 받기 시작하는 출생연도(`nationalPension`, 해당 출생연도가 없는 해는 카드 생략) → 올해 만 65세 출생연도(`age65`) → 성인 자녀 증여공제(`taxRules.gift`). 카드는 연결 도구로 가는 링크. 국민연금 카드가 있으면 `copy.disclaimer.pension`을 아래에 둔다.
- **도구 카드 3개 — 노출 순서 고정**: 건강 체크 → 상속·증여 → 내 나이 달력 (`copy.hub.tools` 순서). 카드 전체가 탭 영역(최소 56px). 구현 순서(달력 먼저)와 노출 순서는 다르다. 번호 배지 대신 도구별 선 아이콘(인라인 SVG).
- **만든 사람**(2026-11-09 추가, Q60): `copy.hub.operatorLabel` · 바이라인 · `copy.hub.operatorText` · 카카오 채널 1:1 채팅 링크(`KAKAO_CHANNEL_URL` + `/chat`, 채널 주소가 없으면 링크 숨김). 사진 없음.
- 채널 추가 버튼. 허브에는 **공유 버튼 없음**.
- 배치: 히어로 → 이번 주 다이어리 → 올해 알아둘 숫자 → 도구 → 만든 사람 → 채널 추가. 이 부분은 PNG(sb-07)보다 이 명세가 우선한다.
- 성능: LCP 1.5초(4G), 이미지 없음(SVG 인라인), 서버 호출 없음.

### SB-02 내 나이 달력 — 입력 `/calendar/` (PNG: sb-08)
- 제목 `copy.calendar.headline`, 보조문 `copy.calendar.sub`.
- 생년월일: **숫자 8자리 입력**(`19740203`) → 자동 포맷 `1974.02.03`. 데이트피커 사용 금지. 범위 1900-01-01 ~ 오늘. 오류 문구는 `copy.calendar.errors`(필드 아래 빨간 한 줄, 모달 금지, 버튼은 활성 유지).
- 기준일(선택): 기본 오늘, "기준일 바꾸기" 링크를 펼치면 입력. 미래 날짜 허용.
- "달력 만들기" → **같은 페이지**에서 결과 상태로 전환(라우팅·서버 호출 없음). Enter 동일.
- 안내 카드 "무엇을 보여주나요?" 5항목(`copy.calendar.whatItems`) — 결과 화면 순서와 동일.

### SB-03 내 나이 달력 — 결과 (PNG: sb-09)
- 입력 요약 한 줄 + "수정"(값 유지한 채 입력 상태로).
- **만 나이 카드**: 만 나이 26px 이상 + 다음 생일 날짜 + D-day 배지(accent). 생일 당일 `D-0 · 오늘`.
- **날짜 목록(타임라인)**: `ageCalendar()`의 `rows` — 기준일 이후 항목만, 오름차순, 최대 5행. 행 = 날짜 · 제목 · 보조문(`copy.calendar.result.rows`). 항목: 올해 검진 대상(해당 시 첫 행, accent) · 다음 상령일(보험나이 N→N+1) · 다음 검진 연도 · 국민연금 시작(개시 나이·생일 다음 달) · 65세. 상령일 행의 ⓘ → `insuranceAgeInfo` 바텀시트.
- 조건 안내 `copy.disclaimer.pension`. 기초연금은 "신청 가능 연령"까지만 — 소득 기준·수급 여부 판단 금지.
- 공유(`copy.calendar.share`) · 다시 만들기. 결과는 화면에만 존재(새로고침 시 초기화, localStorage 미사용).

### SB-04 계산 규칙 (PNG: sb-10) — `assets/ageCalendar.js`
```
insuranceAge(birthISO, baseISO) -> { fullAge, insAge, nextChangeISO }
ageCalendar(birthISO, baseISO, rules) -> { fullAge, nextBirthday, daysToBirthday,
   insurance:{age,nextChange,daysToChange}, checkup:{eligibleThisYear,nextYear},
   pension:{startAge,startDate,startMonth}, age65:{date}, rows:[{key,date,title,sub,highlight}] }
```
- 만 나이: 기준일 − 생년월일, 기준일이 생일 전이면 1 차감. 2/29 출생자는 평년 2/28 생일.
- 보험나이: 마지막 생일 + 6개월 ≤ 기준일 → +1. 월 더하기 후 말일 보정(8/31 + 6M = 2/28·29). 상령일 당일은 올림. 다음 상령일 = 기준일 이후 가장 가까운 "생일+6개월".
- 국민연금: `ageRules.nationalPension.startAgeByBirthYear`; 시작월 = 개시 나이 생일이 속한 달의 **다음 달**.
- 검진: 20세 이상, 기준 연도와 출생연도의 홀짝 일치 시 대상. 다음 대상 연도 = 홀짝 일치하는 다음 해(20세 미만이면 20세 이후 첫 일치 연도).
- 날짜는 `YYYY-MM-DD` **문자열 연산만**(Date 객체 타임존 금지).
- 테스트: `tests/insurance-age.cases.json`(12) + `tests/age-calendar.cases.json` 전부 통과해야 완료.

### SB-05 내 나이 건강 체크 — 선택 `/health/` (PNG: sb-11)
- 나이대 칩 6개(단일, 기본 선택 없음) + 성별 칩 2개. 둘 다 선택 전엔 버튼 비활성.
- 내 나이 달력에서 넘어온 경우 나이대 자동 선택(**세션 메모리**, URL 파라미터 금지).
- 출처 카드 고정(`copy.health.sourceText`).

### SB-06 내 나이 건강 체크 — 결과 (PNG: sb-12)
- `assets/healthData.json` 12세트(6×2)에서 조회. 섹션 3개 고정: 국가건강검진(2년마다) → 국가암검진(암종·주기·검사명, 성별 조건 반영) → 이 나이대에 흔히 챙기는 것(최대 7개 — 2026-11-09 운영자 결정으로 3→4→5→7, 값은 `healthData.json` `limits.commonMax`. 권유형 어미 금지).
- 수치 기준·위험도·판정 문구 금지(의료 자문 아님). "고위험군" 정의는 ⓘ 바텀시트에 출처 원문 그대로.
- 공유 + "내 나이 달력" 교차 링크.
- healthData.json에는 각 항목 `sourceId`와 `reviewedAt` 필수. **초안은 Claude Code가 만들고 운영자가 출처와 대조 후 확정**(확정 전 배포 금지).

### SB-07 상속·증여 간이 계산 — 입력 `/estate/` (PNG: sb-13)
- 탭: 상속 / 증여. 상속: 재산 총액(억 원, 소수 1자리, 0.1–999) · 배우자 유무 · 자녀 수 · 미성년 자녀 수. 증여: 증여재산 · 관계(배우자/성년 자녀/미성년 자녀/기타 친족) · 혼인·출산 공제 해당(체크).
- 자녀 0·배우자 없음 → 계산 생략, `taxRules.inheritance.noChildNoSpouseText` 카드.
- 고지문은 **입력 화면에도** 표시(`copy.disclaimer.tax`).

### SB-08 상속·증여 — 결과 (PNG: sb-14) — `assets/estate.js`
- 4단계 표시: 공제 합계 → 과세 대상 금액 → 세율 구간 → 예상 세액 범위(억·천만 반올림, 범위 표기).
- 과세표준 ≤ 0 → 숫자 카드 대신 `zeroTax` 문장 카드(감정 표현 금지).
- 비율 막대(공제 vs 과세). 국세청 외부 링크(새 탭). 제휴 세무사 노출 없음(3단계).
- 테스트: `tests/estate.cases.json` 전부 통과.

### SB-09 뉴스레터 글 `/diary/{slug}/` (PNG: sb-15)
- 정적 생성. 구성 슬롯 고정: 카테고리·제목·바이라인(`copy.brand.byline`) → 본문(800–1,200자, 소제목 2–3) → **핵심 요약 박스**(2–3줄, 카카오 메시지 요약과 동일 텍스트) → 도구 링크 카드 **1개** → **동의보감 한 줄**(인용 + 출처 편·권 + 오늘의 관점 + 실천 1가지) → 출처(공공·학회 1개 이상, 없으면 빌드 실패) → 고지문.
- 글꼴 16px, 줄간격 1.7, 광고 영역 없음. 이미지는 카드뉴스 1장 선택.
- 빌드 시 `content/weekly.json` 갱신(허브 상단 카드용: title, slug, donguiLine, readMin).

### SB-10 카카오톡 채널 메시지 (PNG: sb-16) — 1단계는 **수동 발송**
- 주간 메시지(와이드 이미지형): 이미지 1200×600 + 제목 + 요약 3줄 + 버튼 2개(글 읽기 / 도구 1개). 버튼 3개 이상 금지.
- 운영자 한마디: 별도 텍스트 말풍선, 80자 이내.
- 1:1 채팅이 문의 창구(폼 없음). 기존고객 1회 안내 문안은 `copy.kakao.oneTimeInvite` — 개인 카톡은 이 1회뿐.
- 구현물: `ops/review`에서 "메시지 복사" 버튼(제목·요약·버튼 URL을 클립보드로) — 발송은 사람이 카카오 채널 관리자에서.

### SB-11 운영자 검토 대기열 `ops/review` (PNG: sb-17)
- 메뉴: 대기열 · 발행 예정 · 발행 완료 · 소스 라이브러리 · 금지어 사전 · 로그. **고객 메뉴 없음.**
- 항목 상태: `outline_pending`(개요 대기) → `draft_pending`(본문 검토) → `approved_scheduled` → `published`; 차단은 `blocked`(1군·근거), 경고는 `warned`(2군).
- **F4-6 개요 선승인**: 에이전트가 제목 3안·목차·사용할 출처 ID를 먼저 제출 → 운영자 "개요 수정" 또는 "개요 승인 → 본문 생성" → 본문 생성 후 검사 → 본문 검토.
- 1군·근거 차단 항목에는 **승인 버튼을 렌더하지 않는다**(우회 UI 없음). "수정 요청" → 재작성 큐.
- 2군 경고: 사유 입력 후 통과 가능(로그).
- 미리보기: 개요는 제목·목차·출처 ID, 본문은 고객 화면 그대로.
- **모바일 간이 뷰**(`/ops/review/m`): 카드 목록 + 승인/반려/개요 수정만.
- 보안: Tailscale 내부망 전용, 로그인 1계정, 세션 12시간, 폴더 `/sources /drafts /approved /published /logs`(고객 폴더 없음을 구조로 보장), 크론 발행 금지.

### SB-12 금지어·근거 검사 `ops/filter` (PNG: sb-18)
- 입력: 텍스트(마크다운/문자열) → 출력: `{ verdict: block|warn|pass, findings:[{tier, word|pattern, location, sentence}], required:{source, disclaimer, byline, noFear} }`.
- 사전은 `data/forbidden-words.json`. 화이트리스트가 1·2군 부분 일치보다 **우선**.
- **F5-5 근거 검사**: `evidence_check.patterns`에 걸리는 문장에 `[S-XXX-NN]` 출처 ID가 같은 문장/문단에 없으면 `block`. 출처 ID는 `ops/sources/index.json`에 존재해야 한다.
- 하이라이트 색: 1군 빨강, 2군 노랑, 근거 없음 주황.
- 재작성 제안: 에이전트가 금지어 없는 대안 + 출처 ID 부착 문장 생성 → "제안 적용 후 재검사".
- CLI: `node ops/filter/cli.mjs file.md` → JSON 결과 + exit code(0 pass / 1 warn / 2 block). 빌드 스크립트가 글마다 실행하고 `block`이면 빌드 실패.

### SB-13 상태·예외 (PNG: sb-19)
- 입력 오류: 필드 아래 빨간 문장 1줄, 모달 금지, 버튼 활성 유지.
- 세금 0원: 문장 카드, 비율 막대 전체 primary.
- 오프라인: 도구 3개는 완전 오프라인 동작(sw.js). 카카오 SDK 미로드 시 공유 버튼만 비활성. 로딩은 스켈레톤(스피너 금지).
- 배포 직후(Q53): 허브·도구 3개 화면은 HTML과 스크립트를 같은 캐시 묶음(VERSION)에서 보여 준다 — 새 HTML에 이전 스크립트가 섞여 깨지지 않게. 새 배포는 다음 방문부터. 사전 캐시는 `?v=VERSION`으로 CDN 캐시를 건너뛰어 받는다. 그 밖의 화면(뉴스레터 글 등)은 네트워크 우선.
- 404: 허브 버튼 1개. 내려간 글은 "이 글은 내려갔습니다" + 허브 버튼.

---

## 5. AI 콘텐츠 공장 (F4) — 에이전트 운영 규칙

- **F4-0 소스 라이브러리**: `ops/sources/{health,tax,age,dongui}/` + `index.json`(`{id:"S-TAX-01", title, publisher, url, checkedAt, path}`). 1주제 = 1라이브러리. 에이전트는 라이브러리 안에서만 초안을 쓰고, 자료에 없으면 "근거 없음"을 명시한다.
- **F4-6 개요 선승인**(SB-11), **F4-7 페르소나 고정**: 시스템 프롬프트에 `copy.brand.byline` 페르소나·어미 규칙·`forbidden-words.json` 요약·문구 가이드 포함. 운영자 승인 없이 변경 불가.
- 출력 규격: 블로그 초안 800–1,200자 + 제목 3안 + 출처 ID; 카드뉴스 6–8장 문구 + 이미지 지시문; 뉴스레터 자동 조립(SB-09 슬롯); 채널 메시지 요약 3줄.
- 서버에는 콘텐츠 폴더만 존재. **고객 데이터·상담 메모·녹음은 어떤 경로로도 에이전트 서버·외부 AI에 올리지 않는다.**

---

## 6. 접근성 · 성능 · 분석

- 접근성: 본문 16px+, 대비 4.5:1+, 터치 44px+, 모든 입력 `label` 연결, 오류 `aria-live`, 200% 확대 시 가로 스크롤 없음, 키보드만으로 계산 완료.
- 성능: LCP 1.5s(4G), CLS 0.05 이하, HTML+CSS+JS gzip 80KB 이하, 외부 스크립트 카카오 SDK 1개(지연), 웹폰트 없음, 이미지 SVG 인라인 또는 WebP ≤ 60KB.
- 분석: 익명 페이지뷰만(경로·일시·참조 채널 kakao/search/direct). IP 원문·쿠키 ID·입력값·결과값·UTM 개인 파라미터 **미수집**. 쿠키 없는 경량 카운터(자체 호스팅 또는 GoatCounter급). 원시 로그 30일 후 삭제.

---

## 7. 구현 순서와 완료 조건 (DoD)

| 순서 | 범위 | 완료 조건 |
|---|---|---|
| 0 | 디자인 토큰·공통 레이아웃 | base.css 토큰화, 헤더·푸터·고지·공유·채널추가 컴포넌트, 접근성 기준 통과 |
| 1 | SB-02/03/04 내 나이 달력 | `tests/insurance-age.cases.json` 12 + `tests/age-calendar.cases.json` 전부 통과, 모바일 실기기 확인, 공유 메시지 확인 → **기존고객 첫 링크 발송 가능** |
| 2 | SB-01 허브 | 이번 주 다이어리 상단(weekly.json), 도구 3개(건강→상속증여→달력), LCP 1.5초 |
| 3 | SB-05/06 건강 체크 | healthData.json 12세트 초안 + 출처 대조표(reviewedAt) — 운영자 확정 전 '초안' 배지 |
| 4 | SB-07/08 상속·증여 | taxRules.json 분리, `tests/estate.cases.json` 통과, 0원 분기 |
| 5 | SB-09 뉴스레터 템플릿 | 마크다운 → 정적 HTML 빌드, 슬롯 필수 검사(출처 없으면 빌드 실패), weekly.json 생성 |
| 6 | SB-12 금지어·근거 검사 | 사전 로드, 화이트리스트 우선, 근거 검사, CLI exit code, 빌드 연동 |
| 7 | SB-11 검토 대기열 | 개요 선승인 → 본문 2단계, 모바일 간이 뷰, Tailscale 인증, 승인 로그, "메시지 복사" |
| 8 | SB-13 예외 · sw.js | 오류 문구 통일, 오프라인 동작, 404 |

각 순서 완료 시 **운영자에게 보고**(변경 파일, 테스트 결과, 스크린샷)하고 다음으로.

---

## 8. 열린 질문 (운영자 결정 대기 — 구현을 막지 않음)

1. 뉴스레터 발행 요일·시간 — 기본값 목요일 09:00으로 구현.
2. 도메인 — **결정(2026-11-10): `https://fcban.bluem-partners.com/`** (bluem-partners.com 서브도메인). 저장소 루트 `CNAME` 파일, `assets/config.js` `SITE_URL`.
3. 카카오 디벨로퍼스 JS 앱 키 — `assets/config.js`에 `KAKAO_JS_KEY` 빈 값, 없으면 공유 버튼 비활성.
4. 사이트 CSS의 실제 글꼴·보조색 — 확인되면 base.css 토큰만 교체.
