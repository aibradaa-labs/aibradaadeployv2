// Netlify Function: laptops
// Returns the centralized laptop dataset (aim for 73 items) with stable structure
// Priority: Netlify Blobs store -> fallback module -> inline legacy

exports.handler = async function handler(_event, _context) {
  try {
    // Try Netlify Blobs if available
    let items = [];
    try {
      const blobs = await import('@netlify/blobs');
      const store = blobs.getStore({ name: 'datasets' });
      const json = await store.get('laptops.json');
      if (json) {
        const parsed = typeof json === 'string' ? JSON.parse(json) : json;
        if (Array.isArray(parsed?.items)) items = parsed.items;
        else if (Array.isArray(parsed)) items = parsed;
      }
    } catch (_) {
      // Blobs not available or not populated yet
    }

    // If no blob data, try repo fallback module
    if (!Array.isArray(items) || !items.length) {
      try {
        const mod = await import('../../src/data/fallbackLaptops.js');
        const all = Array.isArray(mod?.LAPTOP_FALLBACK?.initial)
          ? mod.LAPTOP_FALLBACK.initial
          : Array.isArray(mod?.LAPTOP_FALLBACK?.all)
            ? mod.LAPTOP_FALLBACK.all
            : Array.isArray(mod?.FALLBACK_LAPTOPS)
              ? mod.FALLBACK_LAPTOPS
              : [];
        items = all.slice(0, 73);
      } catch (e) {
        // As last resort, respond empty
        items = [];
      }
    }

    // Normalize minimal shape server-side
    const norm = (x) => ({
      brand: String(x.brand || 'Unknown'),
      model: String(x.model || 'Unknown Model'),
      price: Number(x.price || 0),
      score: Number(x.score || 0),
      platform: String((x.platform || 'NPU')).toUpperCase(),
      why: String(x.why || x.summary || 'Strategic intel pending.'),
      cpu: String(x.cpu || 'TBD'),
      gpu: String(x.gpu || 'TBD'),
      ram: String(x.ram || 'TBD'),
      storage: String(x.storage || 'TBD'),
      display: String(x.display || 'TBD'),
      scores: x.scores || {
        ai: 0, thermals: 0, upgrade: 0, linux: 0, portability: 0, value: 0
      },
      price_source_url: x.price_source_url || '#',
      shopee_url: x.shopee_url || null,
      tiktok_url: x.tiktok_url || null,
      lazada_url: x.lazada_url || null,
      best_deal_url: x.best_deal_url || null
    });

    const payload = {
      items: Array.isArray(items) ? items.map(norm) : [],
      generated_at: new Date().toISOString(),
      source: 'netlify-function'
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify(payload)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: true, message: err?.message || 'Internal error' })
    };
  }
};
