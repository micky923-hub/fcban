// 생성 파일 — 직접 고치지 않는다. 원본: assets/healthData.json (node scripts/sync-data.mjs)
export default {
  "_meta": {
    "name": "healthData",
    "version": "0.1-draft",
    "status": "draft",
    "updatedAt": "2026-11-09",
    "rule": "초안. 운영자가 docs/healthData-review.md 로 출처와 대조해 항목별 reviewedAt(YYYY-MM-DD)을 채우고 status 를 confirmed 로 바꾸기 전에는 화면에 '초안' 배지를 표시하고 배포하지 않는다. 수치 기준·위험도·판정 문구는 넣지 않는다.",
    "note": "초안 작성자는 출처 원문을 직접 열람하지 않았다. 모든 항목·주기·연령은 대조 대상이다."
  },
  "sources": {
    "S-HLT-01": {
      "title": "국민건강보험공단 — 건강검진 안내(일반건강검진 · 성·연령별 검사)",
      "publisher": "국민건강보험공단",
      "url": "https://www.nhis.or.kr/",
      "checkedAt": null
    },
    "S-HLT-02": {
      "title": "국립암센터 — 국가암검진 안내 · 암검진 권고안",
      "publisher": "국립암센터",
      "url": "https://www.ncc.re.kr/",
      "checkedAt": null
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
    "commonMax": 4,
    "rule": "'이 나이대에 흔히 챙기는 것' 최대 항목 수(운영자 결정 2026-11-09: 3 → 4)"
  },
  "info": {
    "liverHighRisk": {
      "title": "간암 고위험군",
      "text": "간경변증, B형간염 바이러스 표면항원 양성, C형간염 바이러스 항체 양성, B형 또는 C형 간염 바이러스에 의한 만성 간질환이 있는 경우입니다.",
      "sourceId": "S-HLT-02",
      "verbatim": false,
      "reviewedAt": null
    },
    "lungHighRisk": {
      "title": "폐암 고위험군",
      "text": "54세부터 74세까지 중 30갑년 이상의 흡연력이 있는 현재 흡연자 등 흡연력 기준에 해당하는 경우입니다.",
      "sourceId": "S-HLT-02",
      "verbatim": false,
      "reviewedAt": null
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
              "reviewedAt": null
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "혈액검사 항목 묶음 표기 확인"
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
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
              "reviewNote": "남성 24세 이상 · 여성 40세 이상, 4년 주기 — 현행 기준 확인"
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "20세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "2025년 청년 대상 주기 변경 여부 확인"
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
              "reviewedAt": null
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "혈액검사 항목 묶음 표기 확인"
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
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
              "reviewNote": "여성 20세 이상"
            }
          ]
        },
        {
          "id": "common",
          "items": [
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "20세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "2025년 청년 대상 주기 변경 여부 확인"
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
              "reviewedAt": null
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "혈액검사 항목 묶음 표기 확인"
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
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
              "reviewNote": "남성 24세 이상 · 여성 40세 이상, 4년 주기 — 현행 기준 확인"
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "30세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "2025년 청년 대상 주기 변경 여부 확인"
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
              "reviewedAt": null
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "혈액검사 항목 묶음 표기 확인"
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
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
              "reviewNote": "여성 20세 이상"
            }
          ]
        },
        {
          "id": "common",
          "items": [
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "30세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "2025년 청년 대상 주기 변경 여부 확인"
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
              "reviewedAt": null
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "혈액검사 항목 묶음 표기 확인"
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
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
              "test": "위내시경",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "40세 이상. 위장조영검사 선택 가능 여부 표기 확인"
            },
            {
              "id": "ca-liver",
              "name": "간암",
              "cycle": "고위험군 6개월마다",
              "test": "간초음파 · 혈청알파태아단백",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "liverHighRisk",
              "reviewNote": "40세 이상 고위험군"
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
              "reviewNote": "남성 24세 이상 · 여성 40세 이상, 4년 주기 — 현행 기준 확인"
            },
            {
              "id": "cm-hbv",
              "name": "B형간염 검사",
              "cycle": "40세",
              "test": "혈액검사",
              "sourceId": "S-HLT-01",
              "reviewedAt": null
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "40세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "10년 주기(20·30·40·50·60·70세) 현행 여부 확인"
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
              "reviewedAt": null
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "혈액검사 항목 묶음 표기 확인"
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
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
              "test": "위내시경",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "40세 이상. 위장조영검사 선택 가능 여부 표기 확인"
            },
            {
              "id": "ca-liver",
              "name": "간암",
              "cycle": "고위험군 6개월마다",
              "test": "간초음파 · 혈청알파태아단백",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "liverHighRisk",
              "reviewNote": "40세 이상 고위험군"
            },
            {
              "id": "ca-breast",
              "name": "유방암",
              "cycle": "2년마다",
              "test": "유방촬영",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "여성 40세 이상"
            },
            {
              "id": "ca-cervix",
              "name": "자궁경부암",
              "cycle": "2년마다",
              "test": "자궁경부세포검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "여성 20세 이상"
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
              "reviewNote": "남성 24세 이상 · 여성 40세 이상, 4년 주기 — 현행 기준 확인"
            },
            {
              "id": "cm-hbv",
              "name": "B형간염 검사",
              "cycle": "40세",
              "test": "혈액검사",
              "sourceId": "S-HLT-01",
              "reviewedAt": null
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "40세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "10년 주기(20·30·40·50·60·70세) 현행 여부 확인"
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
              "reviewedAt": null
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "혈액검사 항목 묶음 표기 확인"
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
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
              "test": "위내시경",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "40세 이상. 위장조영검사 선택 가능 여부 표기 확인"
            },
            {
              "id": "ca-colon",
              "name": "대장암",
              "cycle": "1년마다",
              "test": "분변잠혈검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "50세 이상"
            },
            {
              "id": "ca-liver",
              "name": "간암",
              "cycle": "고위험군 6개월마다",
              "test": "간초음파 · 혈청알파태아단백",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "liverHighRisk",
              "reviewNote": "40세 이상 고위험군"
            },
            {
              "id": "ca-lung",
              "name": "폐암",
              "cycle": "54세부터 · 고위험군 2년마다",
              "test": "저선량 흉부CT",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "lungHighRisk",
              "reviewNote": "54–74세 고위험군(흡연력 기준) — 연령 경계 표기 확인"
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
              "reviewNote": "남성 24세 이상 · 여성 40세 이상, 4년 주기 — 현행 기준 확인"
            },
            {
              "id": "cm-lifestyle",
              "name": "생활습관평가",
              "cycle": "50세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "50세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "10년 주기(20·30·40·50·60·70세) 현행 여부 확인"
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
              "reviewedAt": null
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "혈액검사 항목 묶음 표기 확인"
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
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
              "test": "위내시경",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "40세 이상. 위장조영검사 선택 가능 여부 표기 확인"
            },
            {
              "id": "ca-colon",
              "name": "대장암",
              "cycle": "1년마다",
              "test": "분변잠혈검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "50세 이상"
            },
            {
              "id": "ca-liver",
              "name": "간암",
              "cycle": "고위험군 6개월마다",
              "test": "간초음파 · 혈청알파태아단백",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "liverHighRisk",
              "reviewNote": "40세 이상 고위험군"
            },
            {
              "id": "ca-breast",
              "name": "유방암",
              "cycle": "2년마다",
              "test": "유방촬영",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "여성 40세 이상"
            },
            {
              "id": "ca-cervix",
              "name": "자궁경부암",
              "cycle": "2년마다",
              "test": "자궁경부세포검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "여성 20세 이상"
            },
            {
              "id": "ca-lung",
              "name": "폐암",
              "cycle": "54세부터 · 고위험군 2년마다",
              "test": "저선량 흉부CT",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "lungHighRisk",
              "reviewNote": "54–74세 고위험군(흡연력 기준) — 연령 경계 표기 확인"
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
              "reviewNote": "여성 54·66세 — 2025년 대상 연령 추가 여부 확인"
            },
            {
              "id": "cm-lipid",
              "name": "이상지질혈증 검사",
              "cycle": "4년마다",
              "test": "혈액검사(콜레스테롤 등)",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "남성 24세 이상 · 여성 40세 이상, 4년 주기 — 현행 기준 확인"
            },
            {
              "id": "cm-lifestyle",
              "name": "생활습관평가",
              "cycle": "50세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "50세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "10년 주기(20·30·40·50·60·70세) 현행 여부 확인"
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
              "reviewedAt": null
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "혈액검사 항목 묶음 표기 확인"
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
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
              "test": "위내시경",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "40세 이상. 위장조영검사 선택 가능 여부 표기 확인"
            },
            {
              "id": "ca-colon",
              "name": "대장암",
              "cycle": "1년마다",
              "test": "분변잠혈검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "50세 이상"
            },
            {
              "id": "ca-liver",
              "name": "간암",
              "cycle": "고위험군 6개월마다",
              "test": "간초음파 · 혈청알파태아단백",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "liverHighRisk",
              "reviewNote": "40세 이상 고위험군"
            },
            {
              "id": "ca-lung",
              "name": "폐암",
              "cycle": "고위험군 2년마다",
              "test": "저선량 흉부CT",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "lungHighRisk",
              "reviewNote": "54–74세 고위험군(흡연력 기준) — 연령 경계 표기 확인"
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
              "reviewedAt": null
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "60세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "10년 주기(20·30·40·50·60·70세) 현행 여부 확인"
            },
            {
              "id": "cm-lipid",
              "name": "이상지질혈증 검사",
              "cycle": "4년마다",
              "test": "혈액검사(콜레스테롤 등)",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "남성 24세 이상 · 여성 40세 이상, 4년 주기 — 현행 기준 확인"
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
              "reviewedAt": null
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "혈액검사 항목 묶음 표기 확인"
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
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
              "test": "위내시경",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "40세 이상. 위장조영검사 선택 가능 여부 표기 확인"
            },
            {
              "id": "ca-colon",
              "name": "대장암",
              "cycle": "1년마다",
              "test": "분변잠혈검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "50세 이상"
            },
            {
              "id": "ca-liver",
              "name": "간암",
              "cycle": "고위험군 6개월마다",
              "test": "간초음파 · 혈청알파태아단백",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "liverHighRisk",
              "reviewNote": "40세 이상 고위험군"
            },
            {
              "id": "ca-breast",
              "name": "유방암",
              "cycle": "2년마다",
              "test": "유방촬영",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "여성 40세 이상"
            },
            {
              "id": "ca-cervix",
              "name": "자궁경부암",
              "cycle": "2년마다",
              "test": "자궁경부세포검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "여성 20세 이상"
            },
            {
              "id": "ca-lung",
              "name": "폐암",
              "cycle": "고위험군 2년마다",
              "test": "저선량 흉부CT",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "lungHighRisk",
              "reviewNote": "54–74세 고위험군(흡연력 기준) — 연령 경계 표기 확인"
            }
          ]
        },
        {
          "id": "common",
          "items": [
            {
              "id": "cm-bone",
              "name": "골밀도 검사",
              "cycle": "66세",
              "test": "골밀도 측정",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "여성 54·66세 — 2025년 대상 연령 추가 여부 확인"
            },
            {
              "id": "cm-cognitive",
              "name": "인지기능장애 검사",
              "cycle": "66세 이상 · 2년마다",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "60세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "10년 주기(20·30·40·50·60·70세) 현행 여부 확인"
            },
            {
              "id": "cm-lipid",
              "name": "이상지질혈증 검사",
              "cycle": "4년마다",
              "test": "혈액검사(콜레스테롤 등)",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "남성 24세 이상 · 여성 40세 이상, 4년 주기 — 현행 기준 확인"
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
              "reviewedAt": null
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "혈액검사 항목 묶음 표기 확인"
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
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
              "test": "위내시경",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "40세 이상. 위장조영검사 선택 가능 여부 표기 확인"
            },
            {
              "id": "ca-colon",
              "name": "대장암",
              "cycle": "1년마다",
              "test": "분변잠혈검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "50세 이상"
            },
            {
              "id": "ca-liver",
              "name": "간암",
              "cycle": "고위험군 6개월마다",
              "test": "간초음파 · 혈청알파태아단백",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "liverHighRisk",
              "reviewNote": "40세 이상 고위험군"
            },
            {
              "id": "ca-lung",
              "name": "폐암",
              "cycle": "74세까지 · 고위험군 2년마다",
              "test": "저선량 흉부CT",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "lungHighRisk",
              "reviewNote": "54–74세 고위험군(흡연력 기준) — 연령 경계 표기 확인"
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
              "reviewedAt": null
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "70세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "10년 주기(20·30·40·50·60·70세) 현행 여부 확인"
            },
            {
              "id": "cm-lipid",
              "name": "이상지질혈증 검사",
              "cycle": "4년마다",
              "test": "혈액검사(콜레스테롤 등)",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "남성 24세 이상 · 여성 40세 이상, 4년 주기 — 현행 기준 확인"
            },
            {
              "id": "cm-lifestyle",
              "name": "생활습관평가",
              "cycle": "70세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null
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
              "reviewedAt": null
            },
            {
              "id": "gen-blood",
              "name": "혈당 · 간 기능 · 신장 기능 · 혈색소",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "혈액검사 항목 묶음 표기 확인"
            },
            {
              "id": "gen-xray",
              "name": "요검사 · 흉부 X선",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
            },
            {
              "id": "gen-oral",
              "name": "구강검진",
              "cycle": null,
              "test": null,
              "sourceId": "S-HLT-01",
              "reviewedAt": null
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
              "test": "위내시경",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "40세 이상. 위장조영검사 선택 가능 여부 표기 확인"
            },
            {
              "id": "ca-colon",
              "name": "대장암",
              "cycle": "1년마다",
              "test": "분변잠혈검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "50세 이상"
            },
            {
              "id": "ca-liver",
              "name": "간암",
              "cycle": "고위험군 6개월마다",
              "test": "간초음파 · 혈청알파태아단백",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "liverHighRisk",
              "reviewNote": "40세 이상 고위험군"
            },
            {
              "id": "ca-breast",
              "name": "유방암",
              "cycle": "2년마다",
              "test": "유방촬영",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "여성 40세 이상"
            },
            {
              "id": "ca-cervix",
              "name": "자궁경부암",
              "cycle": "2년마다",
              "test": "자궁경부세포검사",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "reviewNote": "여성 20세 이상"
            },
            {
              "id": "ca-lung",
              "name": "폐암",
              "cycle": "74세까지 · 고위험군 2년마다",
              "test": "저선량 흉부CT",
              "sourceId": "S-HLT-02",
              "reviewedAt": null,
              "infoId": "lungHighRisk",
              "reviewNote": "54–74세 고위험군(흡연력 기준) — 연령 경계 표기 확인"
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
              "reviewedAt": null
            },
            {
              "id": "cm-mental",
              "name": "정신건강검사(우울증)",
              "cycle": "70세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "10년 주기(20·30·40·50·60·70세) 현행 여부 확인"
            },
            {
              "id": "cm-lipid",
              "name": "이상지질혈증 검사",
              "cycle": "4년마다",
              "test": "혈액검사(콜레스테롤 등)",
              "sourceId": "S-HLT-01",
              "reviewedAt": null,
              "reviewNote": "남성 24세 이상 · 여성 40세 이상, 4년 주기 — 현행 기준 확인"
            },
            {
              "id": "cm-lifestyle",
              "name": "생활습관평가",
              "cycle": "70세",
              "test": "설문",
              "sourceId": "S-HLT-01",
              "reviewedAt": null
            }
          ]
        }
      ]
    }
  ]
};
