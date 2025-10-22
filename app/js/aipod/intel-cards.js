import AI_POD from "./runtime-lite.js";

const ROOT_SELECTOR = '[data-role="intel-cards"]';
const VARIANTS = ["cyan-pink", "pink-cyan", "violet-cyan"];
const LABELS = ["Signal Prime", "Signal Echo", "Signal Nova"];
const VERDICT_CLASS = {
  SOLID: "positive",
  WAIT: "neutral",
  HYPE: "watch",
  STANDBY: "standby"
};

function rootElement() {
  return document.querySelector(ROOT_SELECTOR);
}

function escapeHTML(value) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value ?? "").replace(/[&<>"']/g, ch => map[ch]);
}

function escapeAttr(value) {
  return escapeHTML(value).replace(/`/g, "&#96;");
}

function verdictClass(verdict) {
  const key = (verdict ?? "STANDBY").toUpperCase();
  return VERDICT_CLASS[key] ? `intel-status intel-status--${VERDICT_CLASS[key]}` : "intel-status intel-status--standby";
}

function renderSkeleton(root) {
  root.innerHTML = `<div class="intel-grid">
    ${VARIANTS.map(variant => `
      <article class="intel-card intel-card--${variant}" data-state="loading" aria-live="polite">
        <header class="intel-card__header">
          <span class="intel-chip intel-chip--pulse">Acquiring Intel…</span>
        </header>
        <h3 class="intel-card__title">Signal calibrating…</h3>
        <p class="intel-summary">AI Bradaa is scanning for intel…</p>
        <footer class="intel-meta">
          <span class="intel-label">Verdict</span>
          <span class="intel-status intel-status--standby">STANDBY</span>
        </footer>
      </article>`).join("")}
  </div>`;
}

function paint(root, list) {
  if (!Array.isArray(list) || list.length === 0) return;
  const cards = list.slice(0, 3).map((item, index) => {
    const variant = VARIANTS[index % VARIANTS.length];
    const title = escapeHTML(item.title ?? "Intel signal acquired");
    const summary = escapeHTML(item.summary ?? "AI Bradaa is verifying intel…");
    const verdict = (item.verdict ?? "STANDBY").toUpperCase();
    const eta = item.eta_my ? `<span class="intel-separator">•</span><span class="intel-eta">MY ETA: ${escapeHTML(item.eta_my)}</span>` : "";
    const sourceArray = Array.isArray(item.sources)
      ? item.sources
      : [item.source].filter(Boolean);
    const sources = sourceArray
      .map(src => (typeof src === "string" ? src.trim() : ""))
      .filter(Boolean);
    const titleLink = sources[0] ? escapeAttr(sources[0]) : null;
    const titleMarkup = titleLink ? `<a href="${titleLink}" target="_blank" rel="noopener noreferrer">${title}</a>` : title;
    const sourceHeader = titleLink ? `<a class="intel-link" href="${titleLink}" target="_blank" rel="noopener noreferrer">View Source ↗</a>` : "";
    const sourceList = sources
      .slice(1)
      .map((href, idx) => `<a class="intel-link intel-link--secondary" href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">Source ${idx + 2}</a>`)
      .join('<span class="intel-separator">•</span>');
    const sourceListMarkup = sourceList ? `<div class="intel-links">${sourceList}</div>` : "";
    const label = LABELS[index] ?? `Signal ${index + 1}`;
    return `
      <article class="intel-card intel-card--${variant}" data-state="ready" aria-live="polite">
        <header class="intel-card__header">
          <span class="intel-chip">${label}</span>
          ${sourceHeader}
        </header>
        <h3 class="intel-card__title">${titleMarkup}</h3>
        <p class="intel-summary">${summary}</p>
        <footer class="intel-meta">
          <span class="intel-label">Verdict</span>
          <span class="${verdictClass(verdict)}" data-verdict="${escapeHTML(verdict)}">${escapeHTML(verdict)}</span>
          ${eta}
        </footer>
        ${sourceListMarkup}
      </article>`;
  }).join("");

  root.innerHTML = `<div class="intel-grid">${cards}</div>`;
}

async function load() {
  const root = rootElement();
  if (!root) return;
  renderSkeleton(root);

  if (!AI_POD?.provider) {
    console.warn("[AI POD] provider unavailable; intel feed idle");
    return;
  }

  try {
    const response = await AI_POD.provider.call(
      "intel:global_my",
      "You are AI POD for AI Bradaa. Return JSON only.",
      "Give 3 global consumer-tech items with sources and a precise Malaysia ETA. JSON: {intelligence:[{title,summary,verdict,source,eta_my}]}. Verdict∈{SOLID,WAIT,HYPE}. MYR when price appears. Summary ≤ 22 words.",
      { responseMimeType: "application/json" }
    );
    const data = typeof response === "object" && response !== null && "data" in response ? response.data : response;
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    const intelList = parsed?.intelligence ?? [];
    if (intelList.length) {
      paint(root, intelList);
    }
  } catch (error) {
    console.warn("[AI POD] intel parse:", error);
    // Leave skeleton visible; telemetry not required here.
  }
}

export function mountIntel() {
  if (!AI_POD.flags.INTEL) return;
  const root = rootElement();
  if (!root) return;

  let observer;
  const triggerLoad = () => {
    observer?.disconnect();
    load();
  };

  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        triggerLoad();
      }
    }, { rootMargin: "0px 0px -20% 0px" });
    observer.observe(root);
  } else {
    triggerLoad();
  }
}
