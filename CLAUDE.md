# CLAUDE.md — financial-diary

이 저장소는 블루엠파트너스가 운영하는 정보 미디어 **파이낸셜 다이어리**(1단계)의 코드다.
구현 전에 반드시 `docs/SPEC.md`를 읽고, 화면은 `docs/storyboard/sb-NN.png`를 보고 만든다.
이 파일의 규칙은 세션이 바뀌어도 유지된다. 사용자(운영자 반동수) 지시와 충돌하면 사용자에게 **먼저 확인**한다.

## 절대 규칙 — 어기면 기능을 만들지 않는다

1. **보험사·상품·보장·가입 권유를 어디에도 쓰지 않는다.** `data/forbidden-words.json` 1군 단어는 UI 카피·주석·테스트 문자열·커밋 메시지에도 넣지 않는다. 예외 단어(보험나이, 상령일, 국민연금, 기초연금, 국가건강검진)만 허용.
2. **고객 개인정보를 서버로 보내거나 저장하는 코드를 만들지 않는다.** 폼 전송, 서버 저장, localStorage(1단계), 개인 식별 URL 파라미터, 사용자 추적 스크립트 전부 금지. 모든 계산은 브라우저 안에서.
3. **정보성 문장만.** 어미 '~입니다/~합니다'. '하세요·준비하세요·대비' 같은 권유형 금지(허브 히어로 1문장만 예외). 확정 카피는 `data/copy.ko.json`에서 import 하고 임의로 바꾸지 않는다.
4. **발행 자동화 금지.** 크론·웹훅·스케줄러로 콘텐츠를 발행하는 경로를 만들지 않는다. 발행은 `ops/review`의 운영자 승인 클릭으로만.
5. **에이전트 서버(`ops/`)에 고객 폴더를 만들지 않는다.** 폴더는 `/sources /drafts /approved /published /logs`뿐.

## 작업 방식

- 순서는 `docs/SPEC.md` §7 표를 따른다: 0 토큰·공통 → 1 내 나이 달력 → 2 허브 → 3 건강 체크 → 4 상속·증여 → 5 뉴스레터 → 6 금지어·근거 검사 → 7 검토 대기열 → 8 예외·sw.js.
- 각 순서가 끝나면 **멈추고 보고**: 변경 파일 목록, `npm test` 결과, 모바일 뷰포트(390px) 스크린샷. 운영자 확인 후 다음 순서.
- 계산 로직은 **순수 함수**로 분리하고 `tests/*.cases.json`을 그대로 읽는 테스트를 먼저 통과시킨다. 날짜는 `YYYY-MM-DD` 문자열 연산만(Date 타임존 버그 금지).
- 상수(세율·공제·연금 개시표·검진 규칙)는 `data/*.json`에서만 읽는다. 코드에 숫자를 박지 않는다.
- 의존성 추가 금지(프레임워크·UI 라이브러리·분석 SDK). 허용: 카카오 JS SDK 1개. 개발 의존성은 Node 내장 `node:test`로 충분.
- 모르는 것은 추측하지 말고 `docs/OPEN_QUESTIONS.md`에 적고 기본값으로 진행한다(§8 열린 질문 참조).
- 건강 데이터(`assets/healthData.json`)는 **초안**이다. 각 항목에 `sourceId`·`reviewedAt`을 붙이고, 운영자가 확정하기 전에는 화면에 '초안' 배지를 표시한다.

## 디자인

- 토큰은 `assets/base.css`에서만 정의한다. Primary `#0C2340`(bluem-partners.com theme-color), Accent `#2F6FED`, Tint `#EEF3F9`, Ink `#0F1A2B`, Muted `#5B6B7F`, Line `#D3DCE8`, Error `#C94F3D`, Kakao `#FEE500`.
- 헤더는 흰 배경 + 네이비 텍스트 로고 + 헤어라인. 보조 CTA는 텍스트 + 화살표(→ 내부, ↗ 외부). 모서리 6px. 본문 16px 이상. 터치 44px.
- 화면이 PNG와 다르면 PNG가 맞다.

## 명령

```
npm test                      # tests/*.cases.json 러너
node scripts/build.mjs        # content/*.md → diary/{slug}/index.html + content/weekly.json (필터 block이면 실패)
node ops/filter/cli.mjs <md>  # 금지어·근거 검사, exit 0 pass / 1 warn / 2 block
```

## 커밋

- 한 순서(§7) = 한 PR 단위. 메시지는 `feat(calendar): …`, `test(estate): …` 형식.
- 커밋 전에 `node ops/filter/cli.mjs`를 변경된 카피·콘텐츠에 실행해 1군 0건을 확인한다.
