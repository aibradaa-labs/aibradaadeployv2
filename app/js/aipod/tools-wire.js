import AI_POD from "./runtime-lite.js";
const ROOT='[data-role="aipod-tools"]';
function setBusy(btn,flag){ btn.toggleAttribute("aria-busy", !!flag); btn.disabled = !!flag; }
function sanitise(text){ return String(text ?? '').replace(/</g,"&lt;"); }
function say(out,html){
  if (!out) return;
  out.setAttribute("role","status");
  out.setAttribute("aria-live","polite");
  out.innerHTML = html;
  out.dataset.empty = String(!html || !html.trim());
}

const stageLabels = {
  queued: { chip: 'Standing by', stage: 'Primed', state: 'idle' },
  running: { chip: 'Processing', stage: 'Executing', state: 'processing' },
  success: { chip: 'Mission complete', stage: 'Optimal', state: 'complete' },
  error: { chip: 'Check system', stage: 'Attention', state: 'error' }
};

let deckResponseStart = 0;

function formatElapsed(ms = 0) {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function deckResponseStage(stage, ctx = {}){
  const meta = stageLabels[stage] || stageLabels.queued;
  const card = document.getElementById('deck-response-card');
  const chip = document.getElementById('deck-response-chip');
  const stageLabel = document.getElementById('deck-response-stage');
  const stageLabelBm = document.getElementById('deck-response-stage-bm');
  const clock = document.getElementById('deck-response-clock');
  const label = ctx.label ? `${meta.chip} • ${ctx.label}` : meta.chip;
  if (card) {
    card.setAttribute('data-state', meta.state);
    if (ctx.elapsed) card.setAttribute('data-elapsed', String(ctx.elapsed)); else card.removeAttribute('data-elapsed');
  }
  if (chip) {
    chip.textContent = label;
    chip.dataset.stage = meta.state;
  }
  if (stageLabel) stageLabel.textContent = meta.stage.toUpperCase();
  if (stageLabelBm) stageLabelBm.textContent = meta.stage.toUpperCase();
  if (clock) {
    if (meta.state === 'processing') {
      deckResponseStart = Date.now();
      clock.textContent = 'RUNNING';
    } else if (meta.state === 'complete') {
      const elapsed = typeof ctx.elapsed === 'number' ? ctx.elapsed : (deckResponseStart ? Date.now() - deckResponseStart : 0);
      clock.textContent = formatElapsed(elapsed);
    } else if (meta.state === 'error') {
      clock.textContent = 'ERROR';
    } else {
      deckResponseStart = 0;
      clock.textContent = '00:00:00';
    }
  }
}
function formatStructuredResponse(source){
  const text = String(source ?? '').trim();
  if (!text) return '';
  const lines = text.split(/\n+/);
  const sections = [];
  let current = null;

  const pushCurrent = () => {
    if (current) sections.push(current);
  };

  const ensureSection = (title = 'Response') => {
    if (!current) {
      current = { title, paragraphs: [], list: [], pairs: [], actions: [] };
    }
  };

  lines.forEach(raw => {
    const line = raw.trim();
    if (!line) return;
    const heading = line.match(/^#{2,3}\s*(.+)$/);
    if (heading) {
      pushCurrent();
      current = { title: heading[1], paragraphs: [], list: [], pairs: [], actions: [] };
      return;
    }
    const action = line.match(/^=>\s*(.+)$/);
    if (action) {
      ensureSection(current?.title || 'Response');
      current.actions.push(action[1]);
      return;
    }
    if (/^[-*]\s+/.test(line)) {
      ensureSection(current?.title || 'Response');
      current.list.push(line.replace(/^[-*]\s+/, ''));
      return;
    }
    const pair = line.match(/^([^:]{1,40}):\s*(.+)$/);
    if (pair) {
      ensureSection(current?.title || 'Response');
      current.pairs.push({ label: pair[1], value: pair[2] });
      return;
    }
    ensureSection(current?.title || 'Response');
    current.paragraphs.push(line);
  });
  pushCurrent();

  return sections.map(section => {
    const title = sanitise(section.title || 'Response');
    const parts = [];
    if (section.pairs.length) {
      const pairs = section.pairs.map(({ label, value }) => `<div class="deck-response-datum"><dt>${sanitise(label)}</dt><dd>${sanitise(value)}</dd></div>`).join('');
      parts.push(`<dl class="deck-response-data">${pairs}</dl>`);
    }
    if (section.paragraphs.length) {
      const paras = section.paragraphs.map(p => `<p>${sanitise(p)}</p>`).join('');
      parts.push(`<div class="deck-response-paragraphs">${paras}</div>`);
    }
    if (section.list.length) {
      const listItems = section.list.map(item => `<li>${sanitise(item)}</li>`).join('');
      parts.push(`<ul class="deck-response-list">${listItems}</ul>`);
    }
    if (section.actions.length) {
      const buttons = section.actions.map(label => `<button type="button" class="deck-response-action">${sanitise(label)}</button>`).join('');
      parts.push(`<div class="deck-response-actions">${buttons}</div>`);
    }
    return `<section class="deck-response-section"><header>${title}</header><div class="deck-response-section__body">${parts.join('')}</div></section>`;
  }).join('');
}

function addHistorySnapshot(html, meta = {}) {
  const history = document.getElementById('deck-response-history');
  if (!history || !html) return;
  const entry = document.createElement('article');
  entry.className = 'deck-response-entry';
  entry.dataset.stage = meta.stage || 'complete';
  const timestamp = new Date();
  const time = timestamp.toLocaleTimeString('en-MY', { hour12: false });
  const title = meta.label ? sanitise(meta.label) : 'Deck mission';
  entry.innerHTML = `
    <header class="deck-response-entry__header">
      <span>${title}</span>
      <time datetime="${timestamp.toISOString()}">${time}</time>
    </header>
    <div class="deck-response-entry__body">${html}</div>
  `;
  history.prepend(entry);
  while (history.children.length > 4) {
    history.removeChild(history.lastElementChild);
  }
}

function renderResponse(out, payload, meta = {}){
  if (!out) return;
  if (out.dataset.empty === 'false' && out.innerHTML.trim()) {
    addHistorySnapshot(out.innerHTML, meta);
  }
  const html = formatStructuredResponse(payload) || '<section class="deck-response-section"><header>Response</header><div class="deck-response-section__body"><p>AI POD has no update yet.</p></div></section>';
  say(out, html);
  out.dataset.empty = String(!payload);
}
window.__deckResponseStage = deckResponseStage;
window.__deckResponseRender = (out, payload, meta) => renderResponse(out, payload, meta);
export function wireTools(){
  const root = document.querySelector(ROOT); 
  if (!root) return;
  if (!AI_POD?.provider) {
    console.warn("[AI POD] provider unavailable; tools disabled");
    return;
  }
  window.dispatchEvent(new CustomEvent('toolkit:ready'));
  deckResponseStage('queued');
  const consoleEl = document.getElementById('toolkit-console');
  root.querySelectorAll("[data-action]").forEach(btn=>{
    const action = btn.getAttribute("data-action");
    const out = root.querySelector(`[data-out="${action}"]`) || document.getElementById("toolkit-output");
    if (!out && !consoleEl) return;
    btn.addEventListener("click", async () => {
      setBusy(btn, true); 
      deckResponseStage('running', { label: action.replace(/-/g,' ') });
      say(out || consoleEl, "<em>Thinking…</em>");
      const t0=performance.now();
      const { ok, data } = await AI_POD.provider.call(
        "tool:"+action,
        "You are AI POD.",
        `Run ${action} with current inputs.`,
        undefined,
        { meta: { track: true, scope: 'tool', label: action } }
      );
      const ms = Math.round(performance.now()-t0);
      AI_POD.telemetry.emit("tool_used", { name: action, ok, ms });
      const payload = ok === false ? 'AI POD unavailable right now.' : (data ?? '');
      renderResponse(out || consoleEl, payload, { stage: ok === false ? 'error' : 'success', label: action.replace(/-/g,' '), elapsed: ms });
      deckResponseStage(ok === false ? 'error' : 'success', { label: action.replace(/-/g,' '), elapsed: ms });
      setBusy(btn, false);
    });
  });
}
