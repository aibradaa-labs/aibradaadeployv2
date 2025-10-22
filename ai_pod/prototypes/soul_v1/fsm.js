(function(){
  const gauge = document.getElementById('toolkit-gauge');
  if (!gauge) return;
  const root = gauge.querySelector('.toolkit-gauge-ferro');
  const videoRoot = gauge.querySelector('#soul-video-root');
  const v1 = gauge.querySelector('#soul-video-1');
  const v2 = gauge.querySelector('#soul-video-2');
  const sprites = {
    red: gauge.querySelector('.soul-sprite--red'),
    amber: gauge.querySelector('.soul-sprite--amber'),
    green: gauge.querySelector('.soul-sprite--green'),
    neutral: gauge.querySelector('.soul-sprite--neutral')
  };

  const noop = () => void 0;

  // Crossfade scheduler for neutral: Animation2 -> Animation1 -> repeat
  let crossfadeTimer = null;
  let currentNeutral = 'v2';
  function setupNeutralLoop() {
    if (!videoRoot || !v1 || !v2) return;
    try { v1.loop = false; v2.loop = false; } catch (e) { noop(e); }
    // Ensure starting states
    v1.pause(); v2.pause();
    v1.currentTime = 0; v2.currentTime = 0;
    // Set sources lazily when switching to video mode
    try {
      if (v1 && !v1.getAttribute('src') && v1.dataset?.src) v1.setAttribute('src', v1.dataset.src);
      if (v2 && !v2.getAttribute('src') && v2.dataset?.src) v2.setAttribute('src', v2.dataset.src);
    } catch (e) { noop(e); }
    setActiveVideo('v2', true); // start with animation2
    scheduleNextCrossfade();
  }
  function clearNeutralLoop(){ if (crossfadeTimer) { clearTimeout(crossfadeTimer); crossfadeTimer = null; } }
  function playSafe(video){
    if (!video) return;
    try {
      const maybe = video.play?.();
      if (maybe && typeof maybe.then === 'function') {
        maybe.catch((err) => {
          if (err?.name !== 'AbortError') {
            try { window.aiPodTelemetry?.emit?.('soul.video.error', { stage: current, message: err?.message, ts: new Date().toISOString() }); } catch (e) { noop(e); }
          }
        });
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        try { window.aiPodTelemetry?.emit?.('soul.video.error', { stage: current, message: err?.message, ts: new Date().toISOString() }); } catch (e) { noop(e); }
      }
    }
  }

  function pauseSafe(video){
    if (!video) return;
    try { video.pause?.(); } catch (e) { noop(e); }
  }

  function setActiveVideo(which, immediate=false){
    currentNeutral = which;
    const a = which === 'v1' ? v1 : v2;
    const b = which === 'v1' ? v2 : v1;
    if (!a || !b) return;
    a.style.opacity = '1'; a.style.transition = immediate ? 'none' : 'opacity 820ms ease';
    b.style.opacity = '0'; b.style.transition = immediate ? 'none' : 'opacity 820ms ease';
    playSafe(a);
    pauseSafe(b);
  }
  function scheduleNextCrossfade(){
    clearNeutralLoop();
    const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DUR = prefersReduced ? 9000 : 6500; // slower when reduced motion
    if (document.hidden) return; // don't schedule while hidden
    crossfadeTimer = setTimeout(() => {
      setActiveVideo(currentNeutral === 'v2' ? 'v1' : 'v2');
      scheduleNextCrossfade();
    }, DUR);
  }

  // FSM with hysteresis
  const STAGE = { queued:'queued', running:'running', success:'success', error:'error' };
  const HYSTERESIS_MS = { running: 200, success: 300, error: 300, queued: 0 };
  let current = STAGE.running;
  let lastSwitch = Date.now();
  let pendingStage = null;
  let rafId = 0;

  function commitStageChange(stage){
    const prev = current;
    current = stage; lastSwitch = Date.now();
    gauge.dataset.stage = stage;
    try { window.aiPodTelemetry?.emit?.('soul.status', { from: prev, to: stage, ts: new Date().toISOString() }); } catch (e) { noop(e); }
    if (stage === STAGE.queued) {
      root?.classList.add('soul-video-mode');
      root?.classList.remove('soul-sprite-mode');
      setupNeutralLoop();
    } else {
      root?.classList.add('soul-sprite-mode');
      root?.classList.remove('soul-video-mode');
      clearNeutralLoop();
      pauseSafe(v1); pauseSafe(v2);
      if (sprites.red) sprites.red.classList.toggle('breathe', stage === STAGE.error);
      if (sprites.amber) sprites.amber.classList.toggle('breathe', stage === STAGE.running);
      if (sprites.green) sprites.green.classList.toggle('breathe', stage === STAGE.success);
    }
  }

  function applyStage(stage){
    if (!stage || stage === current) return;
    const now = Date.now();
    const needed = HYSTERESIS_MS[stage] || 0;
    if (now - lastSwitch < needed) return; // debounce rapid flaps
    pendingStage = stage;
    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        if (pendingStage && pendingStage !== current) commitStageChange(pendingStage);
        pendingStage = null;
      });
    }
  }

  // Bridge with legacy setter
  const stageByStatus = { 0: 'queued', 1: 'running', 2: 'success', 3: 'error' };
  const alias = { ready: 2, progress: 1, start: 0, error: 3, queued: 0, running: 1, success: 2, neutral: 0 };
  const legacy = window.aiBradaaSoulSetStatus;
  window.aiBradaaSoulSetStatus = function(state){
    const stateKey = typeof state === 'string' ? state.toLowerCase() : undefined;
    const fromAlias = stateKey && Object.prototype.hasOwnProperty.call(alias, stateKey) ? alias[stateKey] : undefined;
    const numeric = (typeof state === 'number' && Number.isFinite(state)) ? state : fromAlias;
    const v = Number.isFinite(numeric) ? numeric : 1;
    const stage = stageByStatus[v] || 'running';
    applyStage(stage);
    return typeof legacy === 'function' ? legacy(state) : v;
  };

  // Status topic from AI POD orchestrator
  const topic = (window.AI_POD?.telemetry?.status_topic) || 'aipod:status';
  try {
    window.addEventListener(topic, (ev) => {
      const s = (ev?.detail?.status || '').toString().toLowerCase();
      if (s === 'queued' || s === 'neutral') applyStage(STAGE.queued);
      else if (s === 'running' || s === 'amber') applyStage(STAGE.running);
      else if (s === 'success' || s === 'green') applyStage(STAGE.success);
      else if (s === 'error' || s === 'red') applyStage(STAGE.error);
    });
  } catch (e) { noop(e); }

  // Preload assets
  function preload(img){ const i = new Image(); i.src = img; }
  if (sprites.red?.src) preload(sprites.red.src);
  if (sprites.amber?.src) preload(sprites.amber.src);
  if (sprites.green?.src) preload(sprites.green.src);

  if (videoRoot) {
    pauseSafe(v1);
    pauseSafe(v2);
    setTimeout(setupNeutralLoop, 0);
  }

  // Pause/resume when tab visibility changes
  try {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearNeutralLoop();
        pauseSafe(v1); pauseSafe(v2);
      } else if (current === STAGE.queued) {
        setupNeutralLoop();
      }
    });
  } catch (e) { noop(e); }

  // Cleanup
  try {
    addEventListener('pagehide', clearNeutralLoop, { passive: true });
    addEventListener('beforeunload', clearNeutralLoop, { passive: true });
  } catch (e) { noop(e); }
})();
