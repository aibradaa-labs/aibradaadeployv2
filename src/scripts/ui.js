import { STATE } from './state.js';

export function createUIController({ callAIAgent, buildAffiliateLink }) {
  function configureCharts() {
    if (!window.Chart) return;
    Chart.defaults.color = '#A8B2CC';
    Chart.defaults.font = STATE.config.chartFont;
    Chart.defaults.borderColor = 'rgba(48, 54, 61, 0.8)';
  }

  function renderAppendicesList(data) {
    const container = document.getElementById('laptop-list-container');
    if (!container) return;

    if (data.length === 0) {
      container.innerHTML = '<p class="text-center text-lg text-[var(--c-text-secondary)] xl:col-span-3">No units match current filter parameters.</p>';
      return;
    }

    container.innerHTML = data
      .map((laptop, index) => `
        <div class="card bg-[var(--c-bg)] flex flex-col overflow-hidden">
          <img src="${laptop.imageUrl}" alt="${laptop.model}" class="w-full h-48 object-cover" onerror="this.onerror=null;this.src='https://placehold.co/600x400/1a1a1a/4a4a4a?text=Intel+Image';">
          <div class="p-4 flex flex-col flex-grow">
            <div class="flex-grow">
              <div class="flex justify-between items-start">
                <span class="text-xs font-semibold uppercase tracking-wider text-[var(--c-text-secondary)]">${laptop.brand}</span>
                <span class="text-sm font-bold py-1 px-2 rounded-full ${laptop.platform === 'CUDA' ? 'bg-cyan-900/50 text-cyan-300' : laptop.platform === 'NPU' ? 'bg-pink-900/50 text-pink-300' : 'bg-gray-700/50 text-gray-300'}">${laptop.platform}</span>
              </div>
              <h4 class="font-semibold text-sm mt-1 text-[var(--c-text-primary)] font-body">${laptop.model}</h4>
              <p class="text-xs text-[var(--c-text-secondary)] mt-2 italic">"${laptop.why}"</p>
            </div>
            <div class="mt-4 pt-3 border-t border-[var(--c-border)] text-xs text-[var(--c-text-secondary)] space-y-1">
              <p><b class="font-semibold w-16 inline-block text-[var(--c-text-primary)]">CPU:</b> ${laptop.cpu}</p>
              <p><b class="font-semibold w-16 inline-block text-[var(--c-text-primary)]">GPU:</b> ${laptop.gpu}</p>
              <p><b class="font-semibold w-16 inline-block text-[var(--c-text-primary)]">RAM:</b> ${laptop.ram}</p>
              <p><b class="font-semibold w-16 inline-block text-[var(--c-text-primary)]">Display:</b> ${laptop.display}</p>
            </div>
            <div class="mt-4 border-t border-[var(--c-border)] pt-4">
              <div class="flex justify-between items-center text-sm">
                <span class="font-semibold text-lg text-[var(--c-text-primary)]">RM ${laptop.price}</span>
                <div class="text-right">
                  <span class="block text-xs text-[var(--c-text-secondary)]">Score</span>
                  <span class="font-bold text-lg text-[var(--c-accent-cyan)]">${laptop.score}</span>
                </div>
              </div>
              <div class="relative mt-3">
                <button data-action="toggle-price-menu" data-index="${index}" class="w-full text-center bg-[var(--c-accent-cyan)] text-[var(--c-bg)] text-xs font-bold py-2 px-3 rounded-md hover:opacity-90 transition flex items-center justify-center">
                  Check Price
                  <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div id="price-menu-${index}" class="price-menu hidden absolute bottom-full mb-2 w-full bg-[var(--c-bg)] border border-[var(--c-border)] rounded-md shadow-lg z-10 overflow-hidden">
                  <a href="${buildAffiliateLink(laptop.price_source_url, 'official')}" target="_blank" class="block px-4 py-2 text-xs text-[var(--c-text-secondary)] hover:bg-[var(--c-border)]">Official Website</a>
                  <a href="${buildAffiliateLink(laptop.shopee_url, 'shopee')}" target="_blank" class="block px-4 py-2 text-xs text-[var(--c-text-secondary)] hover:bg-[var(--c-border)]">Shopee</a>
                  ${laptop.tiktok_url ? `<a href="${buildAffiliateLink(laptop.tiktok_url, 'tiktok')}" target="_blank" class="block px-4 py-2 text-xs text-[var(--c-text-secondary)] hover:bg-[var(--c-border)]">Tiktok Shop</a>` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      `)
      .join('');
  }

  function renderCharts(data) {
    const top15 = data.slice(0, 15);
    const rankingsData = {
      labels: top15.map(d => d.model),
      datasets: [{ label: 'Score', data: top15.map(d => d.score), backgroundColor: 'rgba(0, 240, 255, 0.7)' }]
    };

    if (!STATE.ui.charts.rankings) {
      STATE.ui.charts.rankings = new Chart('rankingsChart', {
        type: 'bar',
        data: rankingsData,
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true, max: 100 } }
        }
      });
    } else {
      STATE.ui.charts.rankings.data = rankingsData;
      STATE.ui.charts.rankings.update();
    }

    const valueData = {
      datasets: [
        {
          data: data.map(d => ({ x: d.price, y: d.score, model: d.model })),
          backgroundColor: data.map(d => STATE.config.platformColorMap[d.platform]),
          pointRadius: 6,
          pointHoverRadius: 10
        }
      ]
    };

    if (!STATE.ui.charts.value) {
      STATE.ui.charts.value = new Chart('valueChart', {
        type: 'scatter',
        data: valueData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: context => `${context.raw.model}: RM${context.raw.x}, Score: ${context.raw.y}`
              }
            }
          },
          scales: {
            x: { title: { display: true, text: 'Price (RM)' } },
            y: { title: { display: true, text: 'Score' } }
          }
        }
      });
    } else {
      STATE.ui.charts.value.data = valueData;
      STATE.ui.charts.value.update();
    }
  }

  function renderAll(data) {
    renderAppendicesList(data);
    renderCharts(data);
  }

  function renderRadarChart() {
    if (!STATE.data.allLaptops.length) return;
    const selected = STATE.data.allLaptops.filter(laptop => STATE.ui.app.radarSelection.includes(laptop.model));
    const colors = ['#D83F87', '#00F0FF', '#F8F32B'];
    const datasets = selected.map((laptop, index) => {
      const hex = colors[index];
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return {
        label: laptop.model,
        data: Object.values(laptop.scores),
        fill: true,
        backgroundColor: `rgba(${r},${g},${b},0.2)`,
        borderColor: hex,
        pointBackgroundColor: hex
      };
    });

    const radarData = {
      labels: ['AI', 'Thermals', 'Upgrade', 'Linux', 'Portability', 'Value'],
      datasets
    };

    if (!STATE.ui.charts.radar) {
      STATE.ui.charts.radar = new Chart('radarChart', {
        type: 'radar',
        data: radarData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              max: 10,
              pointLabels: { font: STATE.config.chartFont },
              ticks: { display: false }
            }
          }
        }
      });
    } else {
      STATE.ui.charts.radar.data = radarData;
      STATE.ui.charts.radar.update();
    }

    const comparisonOutput = document.getElementById('gemini-comparison-output');
    if (selected.length >= 2) {
      callAIAgent('compareLaptops', { laptops: selected }, comparisonOutput);
    } else if (comparisonOutput) {
      comparisonOutput.textContent = "Select some laptops above to see the AI Bradaa's simple comparison...";
    }
  }

  function updateIntelUI(intelligence) {
    intelligence.forEach((item, index) => {
      const el = id => document.getElementById(id);
      el(`intel-${index}-title`)?.textContent = item.title;
      el(`intel-${index}-summary`)?.textContent = item.summary;
      el(`intel-${index}-verdict`)?.textContent = item.verdict;
    });
  }

  function updateIntelUIWithRawText(text) {
    const summaryEl = document.getElementById('intel-0-summary');
    const titleEl = document.getElementById('intel-0-title');
    if (titleEl) titleEl.textContent = 'Intel Feed Anomaly';
    if (summaryEl) {
      summaryEl.textContent = `AI Bradaa found something, but it's a bit scrambled! Here's the raw message: ${text}`;
    }
  }

  function populateBrandFilter() {
    const brandSelect = document.getElementById('brand-filter');
    if (!brandSelect) return;
    const brands = [...new Set(STATE.data.allLaptops.map(laptop => laptop.brand))].sort();
    brandSelect.innerHTML = '<option value="All" selected>All Brands</option>' + brands.map(brand => `<option value="${brand}">${brand}</option>`).join('');
  }

  function populateLaptopSelector() {
    const selector = document.getElementById('laptop-selector-container');
    if (!selector) return;
    selector.innerHTML = STATE.data.sortedByRank
      .map(laptop => `<button class="filter-button radar-selector border border-[var(--c-border)] px-2 py-1 text-xs rounded-md truncate" data-model="${laptop.model.replace(/"/g, '&quot;')}" title="${laptop.model}">${laptop.model}</button>`)
      .join('');
  }

  function renderToolkitConsole(toolId) {
    const consoleEl = document.getElementById('toolkit-console');
    if (!consoleEl) return;
    const laptopOptions = STATE.data.allLaptops
      .map(laptop => `<option value="${laptop.model.replace(/"/g, '&quot;')}">${laptop.model}</option>`)
      .join('');
    const toolUIs = {
      'deal-assassin': `<div class="flex-grow flex flex-col"><label class="mb-2">Product Name:</label><input type="text" id="tool-input-query" placeholder="e.g., Illegear Z7" class="w-full mb-4"><button data-tool-action="deal-assassin" class="action-button mt-auto">✨ Find Best Deal</button></div>`,
      'upgrade-strategist': `<div class="flex-grow flex flex-col"><label class="mb-2">Base Laptop:</label><select id="tool-input-laptop" class="w-full mb-4">${laptopOptions}</select><label class="mb-2">Goal:</label><select id="tool-input-goal" class="w-full mb-4"><option>Run 13B models smoothly</option><option>Maximize storage</option></select><button data-tool-action="upgrade-strategist" class="action-button mt-auto">✨ Get Upgrade Plan</button></div>`,
      'dream-rig-architect': `<div class="flex-grow flex flex-col"><label class="mb-2">Budget (MYR):</label><input type="number" id="tool-input-budget" placeholder="e.g., 8000" class="w-full mb-4"><label class="mb-2">Use:</label><select id="tool-input-use" class="w-full mb-4"><option>AI & CUDA Development</option><option>4K Gaming</option></select><button data-tool-action="dream-rig-architect" class="action-button mt-auto">✨ Architect My Rig</button></div>`,
      'elite-procurement': `<div class="flex-grow flex flex-col"><label class="mb-2">Rare Item:</label><input type="text" id="tool-input-item" placeholder="e.g., Razer Blade 16 Mini-LED" class="w-full mb-4"><button data-tool-action="elite-procurement" class="action-button mt-auto">✨ Initiate Scan</button></div>`,
      'component-recon': `<div class="flex-grow flex flex-col"><label class="mb-2">Component Model:</label><input type="text" id="tool-input-component" placeholder="e.g., Core Ultra 9 185H" class="w-full mb-4"><button data-tool-action="component-recon" class="action-button mt-auto">✨ Run Recon</button></div>`,
      'performance-forecaster': `<div class="flex-grow flex flex-col"><label class="mb-2">Laptop:</label><select id="tool-input-laptop" class="w-full mb-4">${laptopOptions}</select><label class="mb-2">Application:</label><input type="text" id="tool-input-app" placeholder="e.g., Stable Diffusion XL" class="w-full mb-4"><button data-tool-action="performance-forecaster" class="action-button mt-auto">✨ Forecast</button></div>`,
      'system-integrity': `<div class="flex-grow flex flex-col"><label class="mb-2">Issue:</label><textarea id="tool-input-issue" placeholder="e.g., 'BSOD when running PyTorch'" class="w-full mb-4 h-24"></textarea><button data-tool-action="system-integrity" class="action-button mt-auto">✨ Analyze</button></div>`,
      'ecosystem-architect': `<div class="flex-grow flex flex-col"><label class="mb-2">Current Devices:</label><input type="text" id="tool-input-devices" placeholder="e.g., iPhone 15 Pro, iPad Air" class="w-full mb-4"><button data-tool-action="ecosystem-architect" class="action-button mt-auto">✨ Find Best Fit</button></div>`,
      'longevity-analyst': `<div class="flex-grow flex flex-col"><label class="mb-2">Laptop:</label><select id="tool-input-laptop" class="w-full mb-4">${laptopOptions}</select><button data-tool-action="longevity-analyst" class="action-button mt-auto">✨ Analyze Longevity</button></div>`,
      'asset-value': `<div class="flex-grow flex flex-col"><label class="mb-2">Laptop:</label><select id="tool-input-laptop" class="w-full mb-4">${laptopOptions}</select><label class="mb-2">Condition:</label><select id="tool-input-condition" class="w-full mb-4"><option>Like New</option><option>Good</option><option>Fair</option></select><button data-tool-action="asset-value" class="action-button mt-auto">✨ Forecast Value</button></div>`,
      'field-support': `<div class="flex-grow flex flex-col"><label class="mb-2">Query:</label><textarea id="tool-input-query" placeholder="e.g., How to dual-boot Ubuntu?" class="w-full mb-4 h-24"></textarea><button data-tool-action="field-support" class="action-button mt-auto">✨ Request Support</button></div>`,
      default: `<p class="text-lg text-[var(--c-text-secondary)]">Select a tool to begin operation.</p>`
    };

    consoleEl.innerHTML = `
      ${toolUIs[toolId] || toolUIs.default}
      <div id="toolkit-output" class="mt-4 p-4 bg-black/50 rounded-lg min-h-[150px] text-sm text-[var(--c-text-secondary)] gemini-output">Output will appear here...</div>
    `;

    consoleEl.classList.remove('console-animating');
    void consoleEl.offsetWidth;
    consoleEl.classList.add('console-animating');
  }

  return {
    configureCharts,
    renderAll,
    renderRadarChart,
    updateIntelUI,
    updateIntelUIWithRawText,
    renderToolkitConsole,
    populateBrandFilter,
    populateLaptopSelector
  };
}
