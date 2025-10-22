(function(){
  if (!window.AI_POD?.mobile) return;
  function openExternal(url, opts={}){
    const appUrl = opts.appUrl; const webUrl = url;
    const winopen = (u) => window.open(u, '_blank', 'noopener');
    let triedApp = false;
    try {
      if (appUrl) { triedApp = true; winopen(appUrl); }
    } catch (e) { void e; }
    const t = setTimeout(() => { try { winopen(webUrl); } catch (e) { void e; } }, triedApp ? 200 : 0);
    return { cancel: () => clearTimeout(t) };
  }
  window.AI_POD.mobile.appLinks = { openExternal };
})();
