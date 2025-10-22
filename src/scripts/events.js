import { STATE } from './state.js';

export function registerEventHandlers({ ui, callAIAgent, computeFiltered }) {
  const refresh = () => ui.renderAll(computeFiltered());

  document.getElementById('price-filter')?.addEventListener('input', event => {
    STATE.ui.app.price = Number(event.target.value);
    const priceValue = document.getElementById('price-value');
    if (priceValue) priceValue.textContent = event.target.value;
    refresh();
  });

  document.querySelectorAll('.platform-filter').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelector('.platform-filter.active')?.classList.remove('active');
      button.classList.add('active');
      STATE.ui.app.platform = button.dataset.platform;
      refresh();
    });
  });

  document.getElementById('sort-filter')?.addEventListener('change', event => {
    STATE.ui.app.sort = event.target.value;
    refresh();
  });

  document.getElementById('brand-filter')?.addEventListener('change', event => {
    STATE.ui.app.brand = event.target.value;
    refresh();
  });

  document.getElementById('find-match-btn')?.addEventListener('click', () => {
    const payload = {
      criteria: {
        budget: document.getElementById('match-budget')?.value,
        usecase: document.getElementById('match-usecase')?.value,
        portability: document.getElementById('match-portability')?.value
      },
      laptops: STATE.data.allLaptops
    };

    callAIAgent('findMatch', payload, document.getElementById('matchmaker-output'));
  });

  document.getElementById('laptop-selector-container')?.addEventListener('click', event => {
    const button = event.target.closest('.radar-selector');
    if (!button) return;
    const model = button.dataset.model;
    const selection = STATE.ui.app.radarSelection;
    const existingIndex = selection.indexOf(model);
    if (existingIndex > -1) {
      selection.splice(existingIndex, 1);
      button.classList.remove('active');
    } else if (selection.length < 3) {
      selection.push(model);
      button.classList.add('active');
    }
    ui.renderRadarChart();
  });

  document.querySelectorAll('.tool-selector-btn').forEach(button => {
    button.addEventListener('click', event => {
      document.querySelectorAll('.tool-selector-btn.active').forEach(active => active.classList.remove('active'));
      event.currentTarget.classList.add('active');
      ui.renderToolkitConsole(event.currentTarget.dataset.tool);
    });
  });

  document.getElementById('toolkit-console')?.addEventListener('click', event => {
    const actionButton = event.target.closest('[data-tool-action]');
    if (!actionButton) return;
    event.preventDefault();

    const action = actionButton.dataset.toolAction;
    const outputElement = document.getElementById('toolkit-output');
    const payload = {};

    document.querySelectorAll('#toolkit-console [id^="tool-input-"]').forEach(input => {
      const key = input.id.replace('tool-input-', '');
      payload[key] = input.value;
    });

    if (['performance-forecaster', 'longevity-analyst', 'upgrade-strategist'].includes(action)) {
      payload.laptopData = STATE.data.allLaptops.find(laptop => laptop.model === payload.laptop);
    }

    callAIAgent(action, payload, outputElement);
  });

  document.body.addEventListener('click', event => {
    const toggleButton = event.target.closest('[data-action="toggle-price-menu"]');
    document.querySelectorAll('.price-menu:not(.hidden)').forEach(menu => {
      if (!toggleButton || menu.id !== `price-menu-${toggleButton.dataset.index}`) {
        menu.classList.add('hidden');
      }
    });

    if (toggleButton) {
      const menu = document.getElementById(`price-menu-${toggleButton.dataset.index}`);
      menu?.classList.toggle('hidden');
    }
  });

  const navLinks = document.querySelectorAll('.nav-button');
  const sections = document.querySelectorAll('main section');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const targetId = entry.target.id;
        navLinks.forEach(link => {
          const isActive = link.getAttribute('href') === `#${targetId}`;
          link.classList.toggle('active', isActive);
        });
      }
    });
  }, { rootMargin: '-40% 0px -60% 0px' });

  sections.forEach(section => observer.observe(section));
}
