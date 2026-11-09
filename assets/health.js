// 내 나이 건강 체크(SB-06) 화면 모델 — 순수 함수. DOM 을 쓰지 않는다.
// 데이터는 assets/healthData.json(초안) 에서만 읽는다.

/** 초안 여부: 데이터 status 가 confirmed 가 아니거나, 표시할 항목 중 reviewedAt 이 빈 것이 있으면 초안 */
export function isDraftSet(data, set) {
  if (!data || data._meta?.status !== 'confirmed') return true;
  if (!set) return true;
  const items = set.sections.flatMap((s) => s.items);
  const infos = items.filter((i) => i.infoId).map((i) => data.info[i.infoId]);
  return [...items, ...infos].some((x) => !x || !x.reviewedAt);
}

export const findSet = (data, ageGroup, sex) => data.sets.find((s) => s.ageGroup === ageGroup && s.sex === sex) || null;

/**
 * @param {object} data   healthData.json
 * @param {object} copy   copy.ko.json
 * @param {string} ageGroup  예: '50s'
 * @param {string} sex   'male' | 'female'
 */
export function healthModel(data, copy, ageGroup, sex) {
  const set = findSet(data, ageGroup, sex);
  if (!set) return null;
  const titles = copy.health.result.sections; // [국가건강검진(2년마다), 국가암검진, 이 나이대에 흔히 챙기는 것]
  const byId = Object.fromEntries(set.sections.map((s) => [s.id, s.items]));
  const group = data.ageGroups.find((g) => g.id === ageGroup);
  const sexInfo = data.sexes.find((s) => s.id === sex);
  return {
    summary: `${group.label} · ${sexInfo.label}`,
    draft: isDraftSet(data, set),
    general: { title: titles[0], items: byId.general.map((i) => i.name) },
    cancer: {
      title: titles[1],
      items: byId.cancer.map((i) => ({
        name: i.name,
        detail: [i.cycle, i.test].filter(Boolean).join(' · '),
        info: i.infoId ? data.info[i.infoId] : null,
      })),
    },
    common: {
      title: titles[2],
      items: byId.common.slice(0, 3).map((i) => [i.name, i.cycle].filter(Boolean).join(' · ')),
    },
  };
}
