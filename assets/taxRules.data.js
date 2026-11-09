// 생성 파일 — 직접 고치지 않는다. 원본: data/taxRules.json (node scripts/sync-data.mjs)
export default {
  "_meta": {
    "name": "taxRules",
    "version": "2026-11-09",
    "basis": "2026년 현행 상속세 및 증여세법 (유산취득세 전환은 2028년 시행 논의 중 — 개정 시 이 파일만 교체)",
    "unit": "KRW",
    "sources": {
      "S-TAX-01": {
        "title": "국세청 — 상속세 안내(공제·세율)",
        "publisher": "국세청",
        "checkedAt": "2026-11-09"
      },
      "S-TAX-02": {
        "title": "상속세 및 증여세법 §18(기초공제) §19(배우자공제) §21(일괄공제) §26(세율) §53(증여재산공제)",
        "publisher": "법제처",
        "checkedAt": "2026-11-09"
      },
      "S-TAX-03": {
        "title": "국세청 — 증여세 안내(증여재산공제 10년 합산, 혼인·출산 공제)",
        "publisher": "국세청",
        "checkedAt": "2026-11-09"
      },
      "S-TAX-04": {
        "title": "국세청 — 상속·증여세 FAQ",
        "publisher": "국세청",
        "checkedAt": "2026-11-09"
      }
    },
    "displayNote": "간이 계산입니다. 공제 요건·재산 평가에 따라 실제 세액은 달라지며, 세무 자문이 아닙니다."
  },
  "rateTable": {
    "description": "과세표준 구간별 세율과 누진공제. 상속세·증여세 공통.",
    "brackets": [
      {
        "upTo": 100000000,
        "rate": 0.1,
        "progressiveDeduction": 0
      },
      {
        "upTo": 500000000,
        "rate": 0.2,
        "progressiveDeduction": 10000000
      },
      {
        "upTo": 1000000000,
        "rate": 0.3,
        "progressiveDeduction": 60000000
      },
      {
        "upTo": 3000000000,
        "rate": 0.4,
        "progressiveDeduction": 160000000
      },
      {
        "upTo": null,
        "rate": 0.5,
        "progressiveDeduction": 460000000
      }
    ],
    "source": "S-TAX-02"
  },
  "inheritance": {
    "basicDeduction": 200000000,
    "lumpSumDeduction": 500000000,
    "personalDeductions": {
      "perChild": 50000000,
      "minorPerYearUntil19": 10000000,
      "elderly65Plus": 50000000,
      "disabled_perYearToLifeExpectancy": 10000000
    },
    "ruleChooseMax": "max(일괄공제 5억, 기초공제 2억 + 인적공제 합계)",
    "spouseDeduction": {
      "minimum": 500000000,
      "maximum": 3000000000,
      "note": "실제 상속분·법정상속분 한도 적용. 간이 계산기는 최소 5억만 반영하고 상한·한도는 안내문으로만 표시"
    },
    "simplifiedFormula": "공제합계 = max(5억, 2억 + 인적공제) + (배우자 있음 ? 5억 : 0); 과세표준 = max(0, 재산 − 공제합계); 산출세액 = 과세표준 × 세율 − 누진공제",
    "noChildNoSpouseText": "자녀와 배우자가 없는 경우 상속 순위(직계존속·형제자매)에 따라 공제가 달라집니다. 국세청 안내를 확인하세요.",
    "source": "S-TAX-01"
  },
  "gift": {
    "tenYearDeductionByRelation": {
      "spouse": 600000000,
      "linealDescendant_adult": 50000000,
      "linealDescendant_minor": 20000000,
      "linealAscendant": 50000000,
      "otherRelative": 10000000
    },
    "marriageBirthDeduction": {
      "amount": 100000000,
      "note": "직계존속→직계비속, 혼인신고일 전후 2년 또는 자녀 출생일 후 2년 이내, 평생 1억 한도(2024.1.1~)"
    },
    "simplifiedFormula": "공제 = 관계별 10년 공제 + (혼인·출산 해당 ? 1억 : 0); 과세표준 = max(0, 증여재산 − 공제); 산출세액 = 과세표준 × 세율 − 누진공제",
    "source": "S-TAX-03"
  },
  "displayRules": {
    "roundTo": "억·천만 단위 반올림. 결과는 '약 ○억 ○천만 원' 범위 표기",
    "zeroTaxCardText": "세금이 생기지 않는 범위입니다",
    "externalLink": {
      "label": "국세청 상속세 안내 바로가기 ↗",
      "note": "실제 URL은 구현 시 국세청 공식 페이지로 설정",
      "url": "https://www.nts.go.kr/"
    },
    "estimateRange": {
      "rule": "예상 세액 범위: 하한 = 산출세액 × (1 − 신고세액공제율)을 내림, 상한 = 산출세액을 올림. 각 값은 units 중 그 값 이하인 가장 큰 단위(천만 → 백만 → 십만)로 맞춘다.",
      "reportCreditRate": 0.03,
      "reportCreditSource": "상속세 및 증여세법 §69(신고세액공제) — S-TAX-02 범위 밖, 출처 대조 필요",
      "units": [
        10000000,
        1000000,
        100000
      ]
    },
    "roundToUnit": 10000000
  },
  "input": {
    "rule": "재산 입력: 억 원 단위, 소수 1자리, 0.1–999. 자녀·미성년 자녀 수는 0 이상 정수.",
    "amountEokMin": 0.1,
    "amountEokMax": 999,
    "amountDecimals": 1,
    "childrenMax": 20
  }
};
