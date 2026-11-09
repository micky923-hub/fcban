// 생성 파일 — 직접 고치지 않는다. 원본: assets/healthData.json (node scripts/sync-data.mjs)
export default {
  "_meta": {
    "name": "healthData",
    "version": "0.1-draft",
    "status": "draft",
    "updatedAt": "2026-11-09",
    "rule": "초안. 운영자가 docs/healthData-review.md 로 출처와 대조해 항목별 reviewedAt(YYYY-MM-DD)을 채우고 status 를 confirmed 로 바꾸기 전에는 화면에 '초안' 배지를 표시하고 배포하지 않는다. 수치 기준·위험도·판정 문구는 넣지 않는다.",
    "note": "초안 작성자는 출처 원문을 직접 열람하지 않았다. 모든 항목·주기·연령은 대조 대상이다.",
    "firstPass": {
      "checkedAt": "2026-11-09",
      "by": "Claude Code (1차 대조 — 확정 아님)",
      "method": "두 기관 공식 페이지를 WebFetch 로 읽어 항목별로 비교한 뒤, 같은 날 두 페이지 HTML 을 직접 받아 글자를 다시 확인했다. HTML 확인에서 요약 도구가 놓친 내용 2건(간암 고위험군 목록, 위장조영검사 선택)을 바로잡았다. 운영자는 원문 페이지에서 최종 확인한다.",
      "missingFromDraft": []
    }
  },
  "sources": {
    "S-HLT-01": {
      "title": "국민건강보험공단 — 건강모아 · 일반건강검진 실시안내(검사항목 · 성·연령별 검사)",
      "publisher": "국민건강보험공단",
      "url": "https://www.nhis.or.kr/nhis/healthin/wbhaca04500m01.do",
      "checkedAt": null,
      "firstPassAt": "2026-11-09"
    },
    "S-HLT-02": {
      "title": "국립암센터 — 국가암관리사업 · 국가암검진사업",
      "publisher": "국립암센터",
      "url": "https://www.ncc.re.kr/main.ncc?uri=manage01_4",
      "checkedAt": null,
      "firstPassAt": "2026-11-09"
    }
  },
  "ageGroups": [
    {
      "id": "20s",
      "label": "20대",
      "minAge": 20,
      "maxAge": 29
    },
    {
      "id": "30s",
      "label": "30대",
      "minAge": 30,
      "maxAge": 39
    },
    {
      "id": "40s",
      "label": "40대",
      "minAge": 40,
      "maxAge": 49
    },
    {
      "id": "50s",
      "label": "50대",
      "minAge": 50,
      "maxAge": 59
    },
    {
      "id": "60s",
      "label": "60대",
      "minAge": 60,
      "maxAge": 69
    },
    {
      "id": "70plus",
      "label": "70대+",
      "minAge": 70,
      "maxAge": null
    }
  ],
  "sexes": [
    {
      "id": "male",
      "label": "남성"
    },
    {
      "id": "female",
      "label": "여성"
    }
  ],
  "limits": {
    "commonMax": 7,
    "rule": "'이 나이대에 흔히 챙기는 것' 최대 항목 수(운영자 결정 2026-11-09: 3 → 4 → 5 → 7)"
  },
  "info": {
    "liverHighRisk": {
      "title": "간암 고위험군",
      "text": "1.간경변증 2.B형 간염 바이러스 항원 양성 3,C형 간염 바이러스 항체 양성 4.B형 또는 C형 간염 바이러스에 의한 만성 간질환 환자",
      "sourceId": "S-HLT-02",
      "verbatim": true,
      "reviewedAt": null,
      "firstPass": {
        "status": "match",
        "checkedAt": "2026-11-09",
        "quote": "1.간경변증 2.B형 간염 바이러스 항원 양성 3,C형 간염 바이러스 항체 양성 4.B형 또는 C형 간염 바이러스에 의한 만성 간질환 환자",
        "note": "원문 HTML 직접 확인 — 국립암센터 페이지 \"고위험군 기준\" 목록 그대로(\"3,\" 표기도 원문대로). 1차 대조 때 \"만성 간질환은 원문에 없음\"이라 한 것은 요약 도구 누락으로 인한 오판"
      }
    },
    "lungHighRisk": {
      "title": "폐암 고위험군",
      "text": "30갑년 [하루 평균 담배소비량(갑)x흡연기간(년)] 이상의 흡연력을 가진 흡연자\n폐암 발생 고위험군으로 확인되어 국가폐암검진을 받았던 자는 검진 후 금연을 하더라도 금연 15년 이내, 74세까지 폐암검진 대상자에 포함",
      "sourceId": "S-HLT-02",
      "verbatim": true,
      "reviewedAt": null,
      "firstPass": {
        "status": "match",
        "checkedAt": "2026-11-09",
        "quote": "30갑년 [하루 평균 담배소비량(갑)x흡연기간(년)] 이상의 흡연력을 가진 흡연자 / 폐암 발생 고위험군으로 확인되어 국가폐암검진을 받았던 자는 검진 후 금연을 하더라도 금연 15년 이내, 74세까지 폐암검진 대상자에 포함",
        "note": "원문 HTML 직접 확인 — 원문 문장 2개를 글자 그대로 옮김. 그 사이 흡연력 확인 방법 2줄(문진표·금연치료 참여자)은 1군 금지어 패턴에 걸리는 표현이 있어 뺌(OPEN_QUESTIONS Q58)"
      },
      "excerpt": true
    }
  },
  "sets": [
    {
      "ageGroup": "20s",
      "sex": "male",
      "sections": [
        {
          "id": "general",
          "items": [
            {
              "id": "gen-body",
              "name": "신체계측 · 혈압 · 시력 · 청력",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 신체계측(신장·체중·허리둘레·비만도), 시력·청력검사, 혈압측정",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 혈색소, 공복혈당, AST·ALT·γ-GTP(간 기능), 혈청크레아티닌·e-GFR(신장 기능)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 흉부방사선 검사, 요검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 구강검진 — 주기·검사도구는 \"고시 확정 후 추가 예정\"",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "cancer",
          "items": []
        },
        {
          "id": "common",
          "items": [
            {
              "id": "cm-lipid",
              "name": "이상지질혈증 검사",
              "cycle": "24세부터 · 4년마다",
              "test": "혈액검사(콜레스테롤 등)",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 남성 24세 이상·여성 40세 이상 · 4년마다(남 24·28·32…, 여 40·44·48…)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "20세부터 · 2년마다",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 20~34세는 2년마다(20·22·24…34세) — 제안 반영(이전 표기: 20세)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-psychosis",
              "name": "조기정신증 검사",
              "cycle": "20세부터 · 2년마다",
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 20~34세 · 2년마다(20·22·24…34세) — 1차 대조에서 추가",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        }
      ]
    },
    {
      "ageGroup": "20s",
      "sex": "female",
      "sections": [
        {
          "id": "general",
          "items": [
            {
              "id": "gen-body",
              "name": "신체계측 · 혈압 · 시력 · 청력",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 신체계측(신장·체중·허리둘레·비만도), 시력·청력검사, 혈압측정",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 혈색소, 공복혈당, AST·ALT·γ-GTP(간 기능), 혈청크레아티닌·e-GFR(신장 기능)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 흉부방사선 검사, 요검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 구강검진 — 주기·검사도구는 \"고시 확정 후 추가 예정\"",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "cancer",
          "items": [
            {
              "id": "ca-cervix",
              "name": "자궁경부암",
              "cycle": "2년마다",
              "test": "자궁경부세포검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 20세 이상 여성 · 2년 · 자궁경부세포검사",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "common",
          "items": [
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "20세부터 · 2년마다",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 20~34세는 2년마다(20·22·24…34세) — 제안 반영(이전 표기: 20세)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-psychosis",
              "name": "조기정신증 검사",
              "cycle": "20세부터 · 2년마다",
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 20~34세 · 2년마다(20·22·24…34세) — 1차 대조에서 추가",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        }
      ]
    },
    {
      "ageGroup": "30s",
      "sex": "male",
      "sections": [
        {
          "id": "general",
          "items": [
            {
              "id": "gen-body",
              "name": "신체계측 · 혈압 · 시력 · 청력",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 신체계측(신장·체중·허리둘레·비만도), 시력·청력검사, 혈압측정",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 혈색소, 공복혈당, AST·ALT·γ-GTP(간 기능), 혈청크레아티닌·e-GFR(신장 기능)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 흉부방사선 검사, 요검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 구강검진 — 주기·검사도구는 \"고시 확정 후 추가 예정\"",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "cancer",
          "items": []
        },
        {
          "id": "common",
          "items": [
            {
              "id": "cm-lipid",
              "name": "이상지질혈증 검사",
              "cycle": "4년마다",
              "test": "혈액검사(콜레스테롤 등)",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 남성 24세 이상·여성 40세 이상 · 4년마다(남 24·28·32…, 여 40·44·48…)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "34세까지 2년마다 · 35~39세 중 1회",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 20~34세는 2년마다(…30·32·34세), 35~39세는 1회 — 제안 반영(이전 표기: 30세)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-psychosis",
              "name": "조기정신증 검사",
              "cycle": "34세까지 · 2년마다",
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 20~34세 · 2년마다(20·22·24…34세) — 1차 대조에서 추가",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        }
      ]
    },
    {
      "ageGroup": "30s",
      "sex": "female",
      "sections": [
        {
          "id": "general",
          "items": [
            {
              "id": "gen-body",
              "name": "신체계측 · 혈압 · 시력 · 청력",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 신체계측(신장·체중·허리둘레·비만도), 시력·청력검사, 혈압측정",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 혈색소, 공복혈당, AST·ALT·γ-GTP(간 기능), 혈청크레아티닌·e-GFR(신장 기능)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 흉부방사선 검사, 요검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 구강검진 — 주기·검사도구는 \"고시 확정 후 추가 예정\"",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "cancer",
          "items": [
            {
              "id": "ca-cervix",
              "name": "자궁경부암",
              "cycle": "2년마다",
              "test": "자궁경부세포검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 20세 이상 여성 · 2년 · 자궁경부세포검사",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "common",
          "items": [
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "34세까지 2년마다 · 35~39세 중 1회",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 20~34세는 2년마다(…30·32·34세), 35~39세는 1회 — 제안 반영(이전 표기: 30세)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-psychosis",
              "name": "조기정신증 검사",
              "cycle": "34세까지 · 2년마다",
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 20~34세 · 2년마다(20·22·24…34세) — 1차 대조에서 추가",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        }
      ]
    },
    {
      "ageGroup": "40s",
      "sex": "male",
      "sections": [
        {
          "id": "general",
          "items": [
            {
              "id": "gen-body",
              "name": "신체계측 · 혈압 · 시력 · 청력",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 신체계측(신장·체중·허리둘레·비만도), 시력·청력검사, 혈압측정",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 혈색소, 공복혈당, AST·ALT·γ-GTP(간 기능), 혈청크레아티닌·e-GFR(신장 기능)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 흉부방사선 검사, 요검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 구강검진 — 주기·검사도구는 \"고시 확정 후 추가 예정\"",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "cancer",
          "items": [
            {
              "id": "ca-stomach",
              "name": "위암",
              "cycle": "2년마다",
              "test": "위내시경 또는 위장조영검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "checkedAt": "2026-11-09",
                "note": "원문 HTML: \"위내시경검사 또는 위장조영검사 중 원하는 한 가지 방법으로 선택\" — 제안 반영(이전 표기: 위내시경)"
              }
            },
            {
              "id": "ca-liver",
              "name": "간암",
              "cycle": "고위험군 6개월마다",
              "test": "간초음파 · 혈청알파태아단백",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "liverHighRisk",
              "firstPass": {
                "status": "match",
                "note": "원문: 40세 이상 남녀 간암발생고위험군 · 6개월 · 간초음파검사 + 혈청알파태아단백검사",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "common",
          "items": [
            {
              "id": "cm-lipid",
              "name": "이상지질혈증 검사",
              "cycle": "4년마다",
              "test": "혈액검사(콜레스테롤 등)",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 남성 24세 이상·여성 40세 이상 · 4년마다(남 24·28·32…, 여 40·44·48…)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-hbv",
              "name": "B형간염 검사",
              "cycle": "40세",
              "test": "혈액검사",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 40세 · \"보균자 또는 면역자 제외\"",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "40~49세 중 1회",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 40~49세 중 1회 — 제안 반영(이전 표기: 40세)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-lifestyle",
              "name": "생활습관평가",
              "cycle": "40세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 40·50·60·70세",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-plaque",
              "name": "치면세균막검사",
              "cycle": "40세",
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 40세 — 1차 대조에서 추가",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        }
      ]
    },
    {
      "ageGroup": "40s",
      "sex": "female",
      "sections": [
        {
          "id": "general",
          "items": [
            {
              "id": "gen-body",
              "name": "신체계측 · 혈압 · 시력 · 청력",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 신체계측(신장·체중·허리둘레·비만도), 시력·청력검사, 혈압측정",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 혈색소, 공복혈당, AST·ALT·γ-GTP(간 기능), 혈청크레아티닌·e-GFR(신장 기능)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 흉부방사선 검사, 요검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 구강검진 — 주기·검사도구는 \"고시 확정 후 추가 예정\"",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "cancer",
          "items": [
            {
              "id": "ca-stomach",
              "name": "위암",
              "cycle": "2년마다",
              "test": "위내시경 또는 위장조영검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "checkedAt": "2026-11-09",
                "note": "원문 HTML: \"위내시경검사 또는 위장조영검사 중 원하는 한 가지 방법으로 선택\" — 제안 반영(이전 표기: 위내시경)"
              }
            },
            {
              "id": "ca-liver",
              "name": "간암",
              "cycle": "고위험군 6개월마다",
              "test": "간초음파 · 혈청알파태아단백",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "liverHighRisk",
              "firstPass": {
                "status": "match",
                "note": "원문: 40세 이상 남녀 간암발생고위험군 · 6개월 · 간초음파검사 + 혈청알파태아단백검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-breast",
              "name": "유방암",
              "cycle": "2년마다",
              "test": "유방촬영",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 40세 이상 여성 · 2년 · 유방촬영술",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-cervix",
              "name": "자궁경부암",
              "cycle": "2년마다",
              "test": "자궁경부세포검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 20세 이상 여성 · 2년 · 자궁경부세포검사",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "common",
          "items": [
            {
              "id": "cm-lipid",
              "name": "이상지질혈증 검사",
              "cycle": "4년마다",
              "test": "혈액검사(콜레스테롤 등)",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 남성 24세 이상·여성 40세 이상 · 4년마다(남 24·28·32…, 여 40·44·48…)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-hbv",
              "name": "B형간염 검사",
              "cycle": "40세",
              "test": "혈액검사",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 40세 · \"보균자 또는 면역자 제외\"",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "40~49세 중 1회",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 40~49세 중 1회 — 제안 반영(이전 표기: 40세)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-lifestyle",
              "name": "생활습관평가",
              "cycle": "40세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 40·50·60·70세",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-plaque",
              "name": "치면세균막검사",
              "cycle": "40세",
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 40세 — 1차 대조에서 추가",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        }
      ]
    },
    {
      "ageGroup": "50s",
      "sex": "male",
      "sections": [
        {
          "id": "general",
          "items": [
            {
              "id": "gen-body",
              "name": "신체계측 · 혈압 · 시력 · 청력",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 신체계측(신장·체중·허리둘레·비만도), 시력·청력검사, 혈압측정",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 혈색소, 공복혈당, AST·ALT·γ-GTP(간 기능), 혈청크레아티닌·e-GFR(신장 기능)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 흉부방사선 검사, 요검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 구강검진 — 주기·검사도구는 \"고시 확정 후 추가 예정\"",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "cancer",
          "items": [
            {
              "id": "ca-stomach",
              "name": "위암",
              "cycle": "2년마다",
              "test": "위내시경 또는 위장조영검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "checkedAt": "2026-11-09",
                "note": "원문 HTML: \"위내시경검사 또는 위장조영검사 중 원하는 한 가지 방법으로 선택\" — 제안 반영(이전 표기: 위내시경)"
              }
            },
            {
              "id": "ca-colon",
              "name": "대장암",
              "cycle": "1년마다",
              "test": "분변잠혈검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 50세 이상 남녀 · 1년 · 분변잠혈검사(이상소견 시 대장내시경검사)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-liver",
              "name": "간암",
              "cycle": "고위험군 6개월마다",
              "test": "간초음파 · 혈청알파태아단백",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "liverHighRisk",
              "firstPass": {
                "status": "match",
                "note": "원문: 40세 이상 남녀 간암발생고위험군 · 6개월 · 간초음파검사 + 혈청알파태아단백검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-lung",
              "name": "폐암",
              "cycle": "54세부터 · 고위험군 2년마다",
              "test": "저선량 흉부CT",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "lungHighRisk",
              "firstPass": {
                "status": "match",
                "note": "원문: 54세 이상 74세 이하 남·여 중 고위험군 · 2년 · 저선량흉부 CT",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "common",
          "items": [
            {
              "id": "cm-lipid",
              "name": "이상지질혈증 검사",
              "cycle": "4년마다",
              "test": "혈액검사(콜레스테롤 등)",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 남성 24세 이상·여성 40세 이상 · 4년마다(남 24·28·32…, 여 40·44·48…)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-lifestyle",
              "name": "생활습관평가",
              "cycle": "50세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 40·50·60·70세",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "50~59세 중 1회",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 50~59세 중 1회 — 제안 반영(이전 표기: 50세)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-hcv",
              "name": "C형간염 검사",
              "cycle": "56세",
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 56세 — 1차 대조에서 추가",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-lungfn",
              "name": "폐기능검사",
              "cycle": "56세",
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 56세, 66세 — 1차 대조에서 추가",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        }
      ]
    },
    {
      "ageGroup": "50s",
      "sex": "female",
      "sections": [
        {
          "id": "general",
          "items": [
            {
              "id": "gen-body",
              "name": "신체계측 · 혈압 · 시력 · 청력",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 신체계측(신장·체중·허리둘레·비만도), 시력·청력검사, 혈압측정",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 혈색소, 공복혈당, AST·ALT·γ-GTP(간 기능), 혈청크레아티닌·e-GFR(신장 기능)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 흉부방사선 검사, 요검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 구강검진 — 주기·검사도구는 \"고시 확정 후 추가 예정\"",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "cancer",
          "items": [
            {
              "id": "ca-stomach",
              "name": "위암",
              "cycle": "2년마다",
              "test": "위내시경 또는 위장조영검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "checkedAt": "2026-11-09",
                "note": "원문 HTML: \"위내시경검사 또는 위장조영검사 중 원하는 한 가지 방법으로 선택\" — 제안 반영(이전 표기: 위내시경)"
              }
            },
            {
              "id": "ca-colon",
              "name": "대장암",
              "cycle": "1년마다",
              "test": "분변잠혈검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 50세 이상 남녀 · 1년 · 분변잠혈검사(이상소견 시 대장내시경검사)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-liver",
              "name": "간암",
              "cycle": "고위험군 6개월마다",
              "test": "간초음파 · 혈청알파태아단백",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "liverHighRisk",
              "firstPass": {
                "status": "match",
                "note": "원문: 40세 이상 남녀 간암발생고위험군 · 6개월 · 간초음파검사 + 혈청알파태아단백검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-breast",
              "name": "유방암",
              "cycle": "2년마다",
              "test": "유방촬영",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 40세 이상 여성 · 2년 · 유방촬영술",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-cervix",
              "name": "자궁경부암",
              "cycle": "2년마다",
              "test": "자궁경부세포검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 20세 이상 여성 · 2년 · 자궁경부세포검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-lung",
              "name": "폐암",
              "cycle": "54세부터 · 고위험군 2년마다",
              "test": "저선량 흉부CT",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "lungHighRisk",
              "firstPass": {
                "status": "match",
                "note": "원문: 54세 이상 74세 이하 남·여 중 고위험군 · 2년 · 저선량흉부 CT",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "common",
          "items": [
            {
              "id": "cm-bone",
              "name": "골밀도 검사",
              "cycle": "54세",
              "test": "골밀도 측정",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 여성 54·60·66세",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-lipid",
              "name": "이상지질혈증 검사",
              "cycle": "4년마다",
              "test": "혈액검사(콜레스테롤 등)",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 남성 24세 이상·여성 40세 이상 · 4년마다(남 24·28·32…, 여 40·44·48…)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-lifestyle",
              "name": "생활습관평가",
              "cycle": "50세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 40·50·60·70세",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "50~59세 중 1회",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 50~59세 중 1회 — 제안 반영(이전 표기: 50세)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-hcv",
              "name": "C형간염 검사",
              "cycle": "56세",
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 56세 — 1차 대조에서 추가",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-lungfn",
              "name": "폐기능검사",
              "cycle": "56세",
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 56세, 66세 — 1차 대조에서 추가",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        }
      ]
    },
    {
      "ageGroup": "60s",
      "sex": "male",
      "sections": [
        {
          "id": "general",
          "items": [
            {
              "id": "gen-body",
              "name": "신체계측 · 혈압 · 시력 · 청력",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 신체계측(신장·체중·허리둘레·비만도), 시력·청력검사, 혈압측정",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 혈색소, 공복혈당, AST·ALT·γ-GTP(간 기능), 혈청크레아티닌·e-GFR(신장 기능)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 흉부방사선 검사, 요검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 구강검진 — 주기·검사도구는 \"고시 확정 후 추가 예정\"",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "cancer",
          "items": [
            {
              "id": "ca-stomach",
              "name": "위암",
              "cycle": "2년마다",
              "test": "위내시경 또는 위장조영검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "checkedAt": "2026-11-09",
                "note": "원문 HTML: \"위내시경검사 또는 위장조영검사 중 원하는 한 가지 방법으로 선택\" — 제안 반영(이전 표기: 위내시경)"
              }
            },
            {
              "id": "ca-colon",
              "name": "대장암",
              "cycle": "1년마다",
              "test": "분변잠혈검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 50세 이상 남녀 · 1년 · 분변잠혈검사(이상소견 시 대장내시경검사)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-liver",
              "name": "간암",
              "cycle": "고위험군 6개월마다",
              "test": "간초음파 · 혈청알파태아단백",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "liverHighRisk",
              "firstPass": {
                "status": "match",
                "note": "원문: 40세 이상 남녀 간암발생고위험군 · 6개월 · 간초음파검사 + 혈청알파태아단백검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-lung",
              "name": "폐암",
              "cycle": "고위험군 2년마다",
              "test": "저선량 흉부CT",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "lungHighRisk",
              "firstPass": {
                "status": "match",
                "note": "원문: 54세 이상 74세 이하 남·여 중 고위험군 · 2년 · 저선량흉부 CT",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "common",
          "items": [
            {
              "id": "cm-cognitive",
              "name": "인지기능장애 검사",
              "cycle": "66세 이상 · 2년마다",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 66세 이상 · 2년마다(66·68·70…세)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-physical",
              "name": "노인신체기능검사",
              "cycle": "66세",
              "test": "신체기능 측정",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 66·70·80세",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "60~69세 중 1회",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 60~69세 중 1회 — 제안 반영(이전 표기: 60세)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-lipid",
              "name": "이상지질혈증 검사",
              "cycle": "4년마다",
              "test": "혈액검사(콜레스테롤 등)",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 남성 24세 이상·여성 40세 이상 · 4년마다(남 24·28·32…, 여 40·44·48…)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-lungfn",
              "name": "폐기능검사",
              "cycle": "66세",
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 56세, 66세 — 1차 대조에서 추가",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-lifestyle",
              "name": "생활습관평가",
              "cycle": "60세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 40·50·60·70세 — 1차 대조에서 추가",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        }
      ]
    },
    {
      "ageGroup": "60s",
      "sex": "female",
      "sections": [
        {
          "id": "general",
          "items": [
            {
              "id": "gen-body",
              "name": "신체계측 · 혈압 · 시력 · 청력",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 신체계측(신장·체중·허리둘레·비만도), 시력·청력검사, 혈압측정",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 혈색소, 공복혈당, AST·ALT·γ-GTP(간 기능), 혈청크레아티닌·e-GFR(신장 기능)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 흉부방사선 검사, 요검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 구강검진 — 주기·검사도구는 \"고시 확정 후 추가 예정\"",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "cancer",
          "items": [
            {
              "id": "ca-stomach",
              "name": "위암",
              "cycle": "2년마다",
              "test": "위내시경 또는 위장조영검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "checkedAt": "2026-11-09",
                "note": "원문 HTML: \"위내시경검사 또는 위장조영검사 중 원하는 한 가지 방법으로 선택\" — 제안 반영(이전 표기: 위내시경)"
              }
            },
            {
              "id": "ca-colon",
              "name": "대장암",
              "cycle": "1년마다",
              "test": "분변잠혈검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 50세 이상 남녀 · 1년 · 분변잠혈검사(이상소견 시 대장내시경검사)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-liver",
              "name": "간암",
              "cycle": "고위험군 6개월마다",
              "test": "간초음파 · 혈청알파태아단백",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "liverHighRisk",
              "firstPass": {
                "status": "match",
                "note": "원문: 40세 이상 남녀 간암발생고위험군 · 6개월 · 간초음파검사 + 혈청알파태아단백검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-breast",
              "name": "유방암",
              "cycle": "2년마다",
              "test": "유방촬영",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 40세 이상 여성 · 2년 · 유방촬영술",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-cervix",
              "name": "자궁경부암",
              "cycle": "2년마다",
              "test": "자궁경부세포검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 20세 이상 여성 · 2년 · 자궁경부세포검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-lung",
              "name": "폐암",
              "cycle": "고위험군 2년마다",
              "test": "저선량 흉부CT",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "lungHighRisk",
              "firstPass": {
                "status": "match",
                "note": "원문: 54세 이상 74세 이하 남·여 중 고위험군 · 2년 · 저선량흉부 CT",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "common",
          "items": [
            {
              "id": "cm-bone",
              "name": "골밀도 검사",
              "cycle": "60세 · 66세",
              "test": "골밀도 측정",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 여성 54·60·66세 — 60세가 빠져 있음 — 제안 반영(이전 표기: 66세)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-cognitive",
              "name": "인지기능장애 검사",
              "cycle": "66세 이상 · 2년마다",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 66세 이상 · 2년마다(66·68·70…세)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-physical",
              "name": "노인신체기능검사",
              "cycle": "66세",
              "test": "신체기능 측정",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 66·70·80세",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "60~69세 중 1회",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 60~69세 중 1회 — 제안 반영(이전 표기: 60세)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-lipid",
              "name": "이상지질혈증 검사",
              "cycle": "4년마다",
              "test": "혈액검사(콜레스테롤 등)",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 남성 24세 이상·여성 40세 이상 · 4년마다(남 24·28·32…, 여 40·44·48…)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-lungfn",
              "name": "폐기능검사",
              "cycle": "66세",
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 56세, 66세 — 1차 대조에서 추가",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-lifestyle",
              "name": "생활습관평가",
              "cycle": "60세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 40·50·60·70세 — 1차 대조에서 추가",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        }
      ]
    },
    {
      "ageGroup": "70plus",
      "sex": "male",
      "sections": [
        {
          "id": "general",
          "items": [
            {
              "id": "gen-body",
              "name": "신체계측 · 혈압 · 시력 · 청력",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 신체계측(신장·체중·허리둘레·비만도), 시력·청력검사, 혈압측정",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 혈색소, 공복혈당, AST·ALT·γ-GTP(간 기능), 혈청크레아티닌·e-GFR(신장 기능)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 흉부방사선 검사, 요검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 구강검진 — 주기·검사도구는 \"고시 확정 후 추가 예정\"",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "cancer",
          "items": [
            {
              "id": "ca-stomach",
              "name": "위암",
              "cycle": "2년마다",
              "test": "위내시경 또는 위장조영검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "checkedAt": "2026-11-09",
                "note": "원문 HTML: \"위내시경검사 또는 위장조영검사 중 원하는 한 가지 방법으로 선택\" — 제안 반영(이전 표기: 위내시경)"
              }
            },
            {
              "id": "ca-colon",
              "name": "대장암",
              "cycle": "1년마다",
              "test": "분변잠혈검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 50세 이상 남녀 · 1년 · 분변잠혈검사(이상소견 시 대장내시경검사)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-liver",
              "name": "간암",
              "cycle": "고위험군 6개월마다",
              "test": "간초음파 · 혈청알파태아단백",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "liverHighRisk",
              "firstPass": {
                "status": "match",
                "note": "원문: 40세 이상 남녀 간암발생고위험군 · 6개월 · 간초음파검사 + 혈청알파태아단백검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-lung",
              "name": "폐암",
              "cycle": "74세까지 · 고위험군 2년마다",
              "test": "저선량 흉부CT",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "lungHighRisk",
              "firstPass": {
                "status": "match",
                "note": "원문: 54세 이상 74세 이하 남·여 중 고위험군 · 2년 · 저선량흉부 CT",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "common",
          "items": [
            {
              "id": "cm-cognitive",
              "name": "인지기능장애 검사",
              "cycle": "66세 이상 · 2년마다",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 66세 이상 · 2년마다(66·68·70…세)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-physical",
              "name": "노인신체기능검사",
              "cycle": "70세 · 80세",
              "test": "신체기능 측정",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 66·70·80세",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "70~79세 중 1회",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 70~79세 중 1회 — 제안 반영(이전 표기: 70세)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-lipid",
              "name": "이상지질혈증 검사",
              "cycle": "4년마다",
              "test": "혈액검사(콜레스테롤 등)",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 남성 24세 이상·여성 40세 이상 · 4년마다(남 24·28·32…, 여 40·44·48…)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-lifestyle",
              "name": "생활습관평가",
              "cycle": "70세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 40·50·60·70세",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        }
      ]
    },
    {
      "ageGroup": "70plus",
      "sex": "female",
      "sections": [
        {
          "id": "general",
          "items": [
            {
              "id": "gen-body",
              "name": "신체계측 · 혈압 · 시력 · 청력",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 신체계측(신장·체중·허리둘레·비만도), 시력·청력검사, 혈압측정",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 혈색소, 공복혈당, AST·ALT·γ-GTP(간 기능), 혈청크레아티닌·e-GFR(신장 기능)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 흉부방사선 검사, 요검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 구강검진 — 주기·검사도구는 \"고시 확정 후 추가 예정\"",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "cancer",
          "items": [
            {
              "id": "ca-stomach",
              "name": "위암",
              "cycle": "2년마다",
              "test": "위내시경 또는 위장조영검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "checkedAt": "2026-11-09",
                "note": "원문 HTML: \"위내시경검사 또는 위장조영검사 중 원하는 한 가지 방법으로 선택\" — 제안 반영(이전 표기: 위내시경)"
              }
            },
            {
              "id": "ca-colon",
              "name": "대장암",
              "cycle": "1년마다",
              "test": "분변잠혈검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 50세 이상 남녀 · 1년 · 분변잠혈검사(이상소견 시 대장내시경검사)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-liver",
              "name": "간암",
              "cycle": "고위험군 6개월마다",
              "test": "간초음파 · 혈청알파태아단백",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "liverHighRisk",
              "firstPass": {
                "status": "match",
                "note": "원문: 40세 이상 남녀 간암발생고위험군 · 6개월 · 간초음파검사 + 혈청알파태아단백검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-breast",
              "name": "유방암",
              "cycle": "2년마다",
              "test": "유방촬영",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 40세 이상 여성 · 2년 · 유방촬영술",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-cervix",
              "name": "자궁경부암",
              "cycle": "2년마다",
              "test": "자궁경부세포검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 20세 이상 여성 · 2년 · 자궁경부세포검사",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "ca-lung",
              "name": "폐암",
              "cycle": "74세까지 · 고위험군 2년마다",
              "test": "저선량 흉부CT",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "lungHighRisk",
              "firstPass": {
                "status": "match",
                "note": "원문: 54세 이상 74세 이하 남·여 중 고위험군 · 2년 · 저선량흉부 CT",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        },
        {
          "id": "common",
          "items": [
            {
              "id": "cm-cognitive",
              "name": "인지기능장애 검사",
              "cycle": "66세 이상 · 2년마다",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 66세 이상 · 2년마다(66·68·70…세)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-physical",
              "name": "노인신체기능검사",
              "cycle": "70세 · 80세",
              "test": "신체기능 측정",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 66·70·80세",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "70~79세 중 1회",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 70~79세 중 1회 — 제안 반영(이전 표기: 70세)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-lipid",
              "name": "이상지질혈증 검사",
              "cycle": "4년마다",
              "test": "혈액검사(콜레스테롤 등)",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 남성 24세 이상·여성 40세 이상 · 4년마다(남 24·28·32…, 여 40·44·48…)",
                "checkedAt": "2026-11-09"
              }
            },
            {
              "id": "cm-lifestyle",
              "name": "생활습관평가",
              "cycle": "70세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "firstPass": {
                "status": "match",
                "note": "원문: 40·50·60·70세",
                "checkedAt": "2026-11-09"
              }
            }
          ]
        }
      ]
    }
  ]
};
