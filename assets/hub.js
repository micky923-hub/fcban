// 허브(SB-01) 화면 모델 — 순수 함수. DOM 을 쓰지 않는다.
/** '{key}' 자리표시자 치환 (허브가 달력 계산 모듈을 받지 않도록 따로 둔다) */
const fill = (t, v) => String(t).replace(/\{(\w+)\}/g, (_, k) => (k in v ? String(v[k]) : `{${k}}`));

/**
 * content/weekly.json 한 건을 검사한다. 필수 필드가 하나라도 없으면 null(영역 숨김 — 빈 카드 금지).
 * 형식: { title, slug, donguiLine, readMin, publishedAt? }
 */
export function normalizeWeekly(w) {
  if (!w || typeof w !== 'object') return null;
  const title = typeof w.title === 'string' ? w.title.trim() : '';
  const slug = typeof w.slug === 'string' ? w.slug.trim() : '';
  const donguiLine = typeof w.donguiLine === 'string' ? w.donguiLine.trim() : '';
  const readMin = Number(w.readMin);
  if (!title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !donguiLine || !Number.isInteger(readMin) || readMin < 1) return null;
  const publishedAt = typeof w.publishedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(w.publishedAt) ? w.publishedAt : null;
  return { title, slug, donguiLine, readMin, publishedAt };
}

/** 'YYYY-MM-DD' → '11월 12일' (문자열 연산만) */
export function monthDayLabel(iso, labels) {
  const [, m, d] = iso.split('-').map(Number);
  return fill(labels.monthDay, { m, d });
}

/**
 * @param {object} copy   copy.ko.json
 * @param {object|null} weeklyRaw  content/weekly.json 내용(없으면 null)
 * @param {object} labels  LABELS (monthDay)
 */
export function hubModel(copy, weeklyRaw, labels) {
  const w = normalizeWeekly(weeklyRaw);
  return {
    hero: copy.hub.hero,
    sub: copy.hub.sub,
    weekly: w && {
      label: copy.hub.weeklyLabel,
      dateLabel: w.publishedAt ? monthDayLabel(w.publishedAt, labels) : null,
      title: w.title,
      path: `diary/${w.slug}/`,
      dongui: `${copy.newsletter.donguiLabel} · ${w.donguiLine}`,
      readMore: fill(copy.hub.readMore, { min: w.readMin }),
    },
    toolsLabel: copy.hub.toolsLabel,
    // 노출 순서 고정: copy.hub.tools 배열 순서(건강 체크 → 상속·증여 → 내 나이 달력)
    tools: copy.hub.tools.map((t, i) => ({ n: i + 1, id: t.id, title: t.title, sub: t.sub, path: t.path.replace(/^\//, '') })),
    channelLabel: copy.hub.kakaoAdd,
  };
}
