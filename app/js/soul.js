/* AI Bradaa Soul status shim (ferrofluid version) */
(function(){
  const gauge = document.getElementById('toolkit-gauge');
  if (!gauge) return;

  const stageByStatus = { 0: 'queued', 1: 'running', 2: 'success', 3: 'error' };
  const alias = { ready: 2, progress: 1, start: 0, error: 3, queued: 0, running: 1, success: 2 };

  window.aiBradaaSoulSetStatus = function(state){
    const stateKey = typeof state === 'string' ? state : undefined;
    const fromAlias = stateKey && Object.prototype.hasOwnProperty.call(alias, stateKey) ? alias[stateKey] : undefined;
    const numeric = (typeof state === 'number' && Number.isFinite(state)) ? state : fromAlias;
    const v = Number.isFinite(numeric) ? numeric : 1;
    const stage = stageByStatus[v];
    if (stage) {
      gauge.dataset.stage = stage;
      const core = gauge.querySelector('#soul-core');
      if (core) core.dataset.stage = stage;
    }
    return v;
  };
})();

/* Deck AI Pod prototype v1 — psychology-first runtime restructure */
(function(){
  let observerAttached = false;

  function applyPsychologyLayout(container) {
    if (!container || container.dataset.psycheApplied === 'true') return;
    if (container.dataset.deckLayout === 'v2') { container.dataset.psycheApplied = 'true'; return; }

    const rightCol = container.querySelector('#toolkit-interactive');
    const leftCol = Array.from(container.children).find(ch => ch !== rightCol && ch instanceof HTMLElement);
    if (!leftCol || !rightCol) return;

    // Column classes & identifiers
    if (!document.getElementById('toolkit-psyche')) {
      try { leftCol.id = 'toolkit-psyche'; } catch (e) { void 0; }
    }
    leftCol.classList.remove('flex', 'gap-4');
    leftCol.classList.add('psyche-column');
    rightCol.classList.remove('flex', 'gap-3');
    rightCol.classList.add('psyche-column');

    // Live dropdown at top of left column
    const liveDropdown = container.querySelector('#toolkit-live-dropdown');
    if (liveDropdown && liveDropdown.parentElement !== leftCol) {
      try { leftCol.insertBefore(liveDropdown, leftCol.firstChild || null); } catch (e) { void 0; }
    }

    // Prepare key nodes before restructuring
    const insightsList = container.querySelector('#toolkit-insights-list');
    const pills = container.querySelector('#toolkit-pills');
    const toolList = container.querySelector('#toolkit-tool-list');
    const consoleEl = container.querySelector('#toolkit-console');

    // Remove legacy wrappers to avoid duplication
    const oldInsightsWrapper = leftCol.querySelector('.toolkit-insights');
    if (oldInsightsWrapper) {
      try { oldInsightsWrapper.remove(); } catch (e) { void 0; }
    }

    // Build left psyche grid
    const existingGrid = leftCol.querySelector('.psyche-grid');
    if (existingGrid) {
      try { existingGrid.remove(); } catch (e) { void 0; }
    }
    const grid = document.createElement('div');
    grid.className = 'psyche-grid';

    const opsCard = document.createElement('div');
    opsCard.className = 'psyche-card';
    const opsHeading = document.createElement('h4');
    opsHeading.textContent = 'Ops Feed';
    opsCard.appendChild(opsHeading);
    if (insightsList) opsCard.appendChild(insightsList);
    grid.appendChild(opsCard);

    const sigCard = document.createElement('div');
    sigCard.className = 'psyche-card';
    const sigHeading = document.createElement('h4');
    sigHeading.textContent = 'Signals';
    sigCard.appendChild(sigHeading);
    if (pills) sigCard.appendChild(pills);
    grid.appendChild(sigCard);

    leftCol.appendChild(grid);

    // Right column cards
    if (toolList?.parentElement) toolList.parentElement.removeChild(toolList);
    if (consoleEl?.parentElement) consoleEl.parentElement.removeChild(consoleEl);
    rightCol.innerHTML = '';

    const toolCard = document.createElement('div');
    toolCard.className = 'psyche-card';
    const toolHeading = document.createElement('h4');
    toolHeading.textContent = 'Tool Stack';
    toolCard.appendChild(toolHeading);
    if (toolList) toolCard.appendChild(toolList);

    const respCard = document.createElement('div');
    respCard.className = 'psyche-card';
    const respHeading = document.createElement('h4');
    respHeading.textContent = 'Response Field';
    respCard.appendChild(respHeading);
    if (consoleEl) respCard.appendChild(consoleEl);

    rightCol.appendChild(toolCard);
    rightCol.appendChild(respCard);

    container.dataset.psycheApplied = 'true';
  }

  function restructureToolkitPsychology() {
    const containers = document.querySelectorAll('.toolkit-briefing-body');
    containers.forEach(applyPsychologyLayout);
  }

  function ensureObserver() {
    if (observerAttached) return;
    const observer = new MutationObserver((mutations) => {
      let found = false;
      for (const mutation of mutations) {
        if (found) break;
        mutation.addedNodes.forEach(node => {
          if (found || !(node instanceof HTMLElement)) return;
          if (node.matches?.('.toolkit-briefing-body') || node.querySelector?.('.toolkit-briefing-body')) {
            found = true;
          }
        });
      }
      if (found) restructureToolkitPsychology();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    observerAttached = true;
  }

  const safeRun = () => { try { restructureToolkitPsychology(); ensureObserver(); } catch (e) { /* no-op */ } };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeRun, { once: true });
  } else {
    safeRun();
  }
  // Also run when toolkit announces readiness
  window.addEventListener('toolkit:ready', safeRun, { once: true });
})();
