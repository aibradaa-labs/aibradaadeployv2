// AI POD: legacy shim; remove next major.
window.deckEmit ??= (evt, detail) => console.warn('[deckEmit shim]', evt, detail);
