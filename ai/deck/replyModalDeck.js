(function(){
  // ReplyModalDeck: dependency-free modal deck renderer for overlay usage
  // window.ReplyModalDeck.render(rootEl, markdown, { dotsEl }) and .destroy(rootEl)

  const state = new WeakMap();
  const RM = typeof window !== 'undefined' && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function escapeHTML(s){ return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

  function badgeClass(h){
    const t=(h||'').toLowerCase();
    if (t.includes('tl;dr')) return 'cyan';
    if (t.includes('reco')) return 'pink';
    if (t.includes('risk')) return 'amber';
    return 'cyan';
  }

  function badgeLabel(h){
    const raw = String(h||'');
    const t = raw.toLowerCase();
    if (t.includes('tl;dr')) return 'TL;DR 💡';
    if (t.includes('reco')) return 'Recommendation ✅';
    if (t.includes('risk')) return 'Risks ⚠️';
    return raw;
  }

  function parseMarkdown(md){
    if (!md || typeof md !== 'string') return [{ title:'Response', body:'' }];
    const parts = md.replace(/\r\n?/g,'\n').split(/\n?^###\s+/m).filter(Boolean);
    if (parts.length === 1 && !/^#/.test(parts[0])) return [{ title:'Response', body: parts[0] }];
    return parts.map((p)=>{
      const [first, ...rest] = p.split('\n');
      return { title: (first||'').trim(), body: rest.join('\n') };
    });
  }

  // --- Sticky head helpers ---------------------------------------------------
  function deriveHeadMeta(md){
    try {
      const title = (md.match(/^\s*#{1,2}\s+(.+)/m)||[])[1] || '';
      const price = (md.match(/(?:^|\s)Price:\s*([A-Z]*\s?RM?[0-9,\.,\s-]+)/im)||[])[1] || '';
      return { title: title.trim(), price: price.trim() };
    } catch { return { title:'', price:'' }; }
  }

  function renderStickyHead(el, meta, chips){
    if (!el) return;
    const title = escapeHTML(meta?.title || 'Recommendation');
    const price = escapeHTML(meta?.price || '');
    const localChip = chips?.localDb ? '<span class="ai-slide-pill" aria-label="Local DB consulted">Local DB: ✔</span>' : '';
    const webChip = (chips && 'webPulse' in chips)
      ? `<span class="ai-slide-pill" aria-label="Web pulse status">Web pulse: ${chips.webPulse? '✔':'⚠ OFF'}</span>`
      : '';
    el.innerHTML = `
      <div class="ai-deck__headrow" style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <div style="display:flex; align-items:baseline; gap:10px; flex-wrap:wrap;">
          <strong class="ai-deck__model" style="font-family: var(--font-display); letter-spacing:.06em; text-transform:uppercase;">${title||'Recommendation'}</strong>
          ${price?`<span class="ai-deck__price" style="color:#12F9FF;">${price}</span>`:''}
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">${localChip}${webChip}</div>
      </div>`;
  }

  function renderDots(dotsEl, n, go, getIdx){
    if (!dotsEl) return { update: ()=>{} };
    dotsEl.innerHTML = '';
    try { dotsEl.setAttribute('role','tablist'); dotsEl.setAttribute('aria-label','Deck slides'); } catch {}
    for (let i=0;i<n;i++){
      const b = document.createElement('button');
      b.className = 'ai-dot';
      b.setAttribute('role','tab');
      b.setAttribute('tabindex', i===0 ? '0' : '-1');
      b.setAttribute('aria-label', `Go to slide ${i+1} of ${n}`);
      b.addEventListener('click', ()=>go(i));
      b.addEventListener('keydown', (e)=>{
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(i); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); const j=Math.min(n-1, i+1); dotsEl.children[j]?.focus(); go(j); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); const j=Math.max(0, i-1); dotsEl.children[j]?.focus(); go(j); }
      });
      dotsEl.appendChild(b);
    }
    const update = () => {
      const k = getIdx();
      const ds = dotsEl.querySelectorAll('.ai-dot');
      ds.forEach((d,j)=>{ d.setAttribute('aria-current', k===j ? 'true':'false'); d.setAttribute('tabindex', k===j ? '0' : '-1'); });
    };
    return { update };
  }

  function destroy(root){
    const st = state.get(root); if (!st) return;
    root.removeEventListener('wheel', st.onWheel);
    root.removeEventListener('keydown', st.onKey);
    root.removeEventListener('touchstart', st.onTouchStart);
    root.removeEventListener('touchmove', st.onTouchMove);
    root.removeEventListener('scroll', st.onScroll);
    try { st.io?.disconnect(); } catch {}
    state.delete(root);
  }

  function render(root, markdown, { dotsEl, stickyHeadEl=null, chips=null }={}){
    destroy(root);
    try { root.classList.add('ai-deck__slides'); root.setAttribute('role','region'); root.setAttribute('aria-roledescription','carousel'); root.setAttribute('aria-label','AI Bradaa deck'); } catch {}
    const sections = parseMarkdown(markdown);
    const html = sections.map((s, idx)=>{
      const title = escapeHTML(s.title||'');
      const bodyHtml = (window.marked?.parse ? window.marked.parse(s.body||'') : escapeHTML(s.body||'').replace(/\n/g,'<br>'));
      const label = escapeHTML(badgeLabel(s.title));
      const copyBtn = (String(s.title||'').toLowerCase().includes('tl;dr'))
        ? `<button type="button" class="ai-slide-pill" data-copy-tldr title="Copy summary">Copy</button>`
        : '';
      return `<section class="ai-slide ai-deck__card" role="group" aria-label="${title}">
        <div class="ai-slide-shell">
          <div class="ai-slide-header">
            <span class="ai-badge ${badgeClass(s.title)}">${label}</span>
            ${copyBtn}
          </div>
          <div class="ai-body" style="line-height:var(--deck-lh,1.8); font-size:var(--deck-fz,16px);">${bodyHtml}</div>
        </div>
      </section>`;
    }).join('');
    root.innerHTML = html;

    const st = { idx: 0, root, dotsEl, onWheel:null, onKey:null, onTouchStart:null, onTouchMove:null, onScroll:null, io:null };
    state.set(root, st);

    // Sticky head render
    try { renderStickyHead(stickyHeadEl, deriveHeadMeta(markdown), chips); } catch {}

    // --- Citations injection (deck-scoped) ---------------------------------
    try {
      const params = arguments[2] || {};
      const cites = Array.isArray(params.citations) ? params.citations.slice(0,3) : [];
      if (cites.length) {
        const slides = Array.from(root.children);
        const targets = slides.filter(s=>/recommendation|tl;:?dr/i.test(s.getAttribute('aria-label')||''));
        const citeHtml = cites.map((c,i)=>`<span class="ai-cite">[${i+1}] <a href="${escapeHTML(c.url||'#')}" target="_blank" rel="noopener">${escapeHTML(c.title||'Source')}</a></span>`).join(' ');
        targets.forEach(sl=>{
          const body = sl.querySelector('.ai-body');
          if (!body) return;
          const p = body.querySelector('p');
          if (p) { p.insertAdjacentHTML('beforeend', ' ' + citeHtml); }
          else { const div = document.createElement('div'); div.className='ai-cites'; div.innerHTML = citeHtml; body.appendChild(div); }
        });
      }
    } catch {}

    // Telemetry (one-shot)
    try {
      const panel = document.querySelector('.ai-modal-sheet');
      const ts = (localStorage.getItem('aiDeckTextSize')||'md');
      const measure = getComputedStyle(panel).getPropertyValue('--deck-measure');
      if (!window.__deckTelemetryLogged) {
        console.info('[deck] deckMeasure', measure.trim(), 'textSize', ts, 'slides', state ? root.children.length : 0);
        window.__deckTelemetryLogged = true;
      }
      // Emit deckSlides count
      try {
        const evt = { t: Date.now(), name: 'deckSlides', data: { count: root.children.length } };
        window.__deckTelemetry = window.__deckTelemetry||[]; window.__deckTelemetry.push(evt);
        window.dispatchEvent(new CustomEvent('deck:telemetry', { detail: evt }));
      } catch {}
    } catch {}

    const slides = Array.from(root.children);
    const getIdx = ()=>st.idx;
    const go = (i)=>{
      st.idx = Math.max(0, Math.min(slides.length-1, i));
      slides[st.idx].scrollIntoView({ behavior: RM ? 'auto':'smooth', inline:'start', block:'nearest' });
      dots?.update();
      const live = document.getElementById('ai-live');
      if (live) {
        const lab = slides[st.idx].getAttribute('aria-label') || '';
        live.textContent = `Slide ${st.idx+1} of ${slides.length}: ${lab}`;
      }
    };
    const dots = renderDots(dotsEl, slides.length, go, getIdx);

    st.onKey = (e)=>{
      if (e.key === 'ArrowRight') go(st.idx+1);
      else if (e.key === 'ArrowLeft') go(st.idx-1);
    };
    // Remove custom wheel trapping — rely on native scroll-snap
    st.onWheel = null;
    st.onTouchStart = (e)=>{ st._x=e.touches[0].clientX; st._y=e.touches[0].clientY; };
    st.onTouchMove = (e)=>{
      const dx=e.touches[0].clientX - st._x, dy=e.touches[0].clientY - st._y;
      if (Math.abs(dx) > Math.abs(dy) + 8){ if (e.cancelable) e.preventDefault(); if (dx < -28) { go(st.idx+1); st._x=e.touches[0].clientX; try { const evt={t:Date.now(),name:'mobileSwipe',data:{dir:'left'}}; window.__deckTelemetry=(window.__deckTelemetry||[]); window.__deckTelemetry.push(evt); window.dispatchEvent(new CustomEvent('deck:telemetry',{detail:evt})); } catch{} } if (dx > 28){ go(st.idx-1); st._x=e.touches[0].clientX; try { const evt={t:Date.now(),name:'mobileSwipe',data:{dir:'right'}}; window.__deckTelemetry=(window.__deckTelemetry||[]); window.__deckTelemetry.push(evt); window.dispatchEvent(new CustomEvent('deck:telemetry',{detail:evt})); } catch{} } }
    };

    // IntersectionObserver to sync current slide; fallback to scroll handler
    if ('IntersectionObserver' in window) {
      st.io = new IntersectionObserver((entries)=>{
        entries.forEach(ent=>{
          if (ent.isIntersecting && ent.intersectionRatio > 0.6){
            const i = slides.indexOf(ent.target);
            if (i !== -1 && i !== st.idx){ st.idx = i; dots?.update(); const live = document.getElementById('ai-live'); if (live){ const lab = slides[st.idx].getAttribute('aria-label')||''; live.textContent = `Slide ${st.idx+1} of ${slides.length}: ${lab}`; } }
          }
        });
      }, { root, threshold: [0.6, 0.8, 1] });
      slides.forEach(s => st.io.observe(s));
    } else {
      st.onScroll = ()=>{
        const w = root.clientWidth; const gap = 12; // CSS gap
        const i = Math.round(root.scrollLeft / (w + gap));
        if (i !== st.idx){ st.idx = Math.max(0, Math.min(slides.length-1, i)); dots?.update(); const live = document.getElementById('ai-live'); if (live){ const lab = slides[st.idx].getAttribute('aria-label')||''; live.textContent = `Slide ${st.idx+1} of ${slides.length}: ${lab}`; } }
      };
      root.addEventListener('scroll', st.onScroll, { passive:true });
    }

    if (st.onWheel) root.addEventListener('wheel', st.onWheel, { passive:false });
    root.addEventListener('keydown', st.onKey);
    root.addEventListener('touchstart', st.onTouchStart, { passive:true });
    root.addEventListener('touchmove', st.onTouchMove, { passive:false });

    // Copy TL;DR
    try {
      const btn = root.querySelector('[data-copy-tldr]');
      if (btn) {
        btn.addEventListener('click', async ()=>{
          try {
            const first = root.querySelector('.ai-deck__card .ai-body');
            const meta = deriveHeadMeta(markdown);
            const text = `TL;DR — ${meta.title || ''}${meta.price?` | ${meta.price}`:''}\n\n` + (first?.textContent || '').trim();
            await navigator.clipboard.writeText(text);
            btn.textContent = 'Copied';
            setTimeout(()=> btn.textContent = 'Copy', 1200);
          } catch {}
        });
      }
    } catch {}

    go(0);
    try { window.dispatchEvent(new CustomEvent('deck:ready', { detail: { slides: slides.length } })); } catch {}
    return { count: slides.length, destroy: ()=>destroy(root) };
  }

  window.ReplyModalDeck = { render, destroy };
})();
