import { STATE } from './state.js';

export function computeFilteredLaptops() {
  const { price, platform, brand, sort } = STATE.ui.app;
  if (!Array.isArray(STATE.data.allLaptops) || STATE.data.allLaptops.length === 0) {
    return [];
  }

  const deriveYear = (model) => {
    const m = /(20\d{2})/.exec(String(model || ''));
    const y = m ? Number(m[1]) : new Date().getFullYear();
    return Number.isFinite(y) ? y : new Date().getFullYear();
  };

  const recentFirst = [...STATE.data.allLaptops]
    .sort((a, b) => deriveYear(b.model) - deriveYear(a.model));

  const filtered = recentFirst.filter(entry =>
    entry.price <= price &&
    (platform === 'All' || entry.platform === platform) &&
    (brand === 'All' || entry.brand === brand)
  );

  const sorter = {
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    score_desc: (a, b) => b.score - a.score,
    value_desc: (a, b) => b.value_rating - a.value_rating
  };

  return filtered.sort(sorter[sort] || sorter.score_desc).slice(0, 35);
}
