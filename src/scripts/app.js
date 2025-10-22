import { STATE } from './state.js';
import { createUIController } from './ui.js';
import { computeFilteredLaptops } from './filters.js';
import { fetchMarketIntel, callAIAgent, buildAffiliateLink } from './api.js';
import { registerEventHandlers } from './events.js';

const ui = createUIController({ callAIAgent, buildAffiliateLink });

async function initialize() {
  ui.configureCharts();
  await fetchMarketIntel();

  STATE.data.allLaptops.forEach(laptop => {
    laptop.value_rating = (laptop.score * 100) / laptop.price;
  });

  STATE.data.sortedByRank = [...STATE.data.allLaptops]
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  ui.populateBrandFilter();
  ui.populateLaptopSelector();

  const filtered = computeFilteredLaptops();
  ui.renderAll(filtered);
  ui.renderRadarChart();
  ui.renderToolkitConsole('deal-assassin');

  registerEventHandlers({
    ui,
    callAIAgent,
    computeFiltered: computeFilteredLaptops
  });

  callAIAgent('getFutureIntel', {}, null, {
    onIntelSuccess: ui.updateIntelUI,
    onIntelFallback: ui.updateIntelUIWithRawText
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initialize().catch(error => {
    console.error('Initialization failed:', error);
  });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch(error => console.error('Service worker registration failed:', error));
  });
}
