exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const q = String(body.q || '').trim();
    if (!q) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'missing q' }) };

    // If SERPER_API_KEY provided, fetch live snippets; else return empty list gracefully
    const key = process.env.SERPER_API_KEY;
    if (key) {
      const resp = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q, gl: 'my', hl: 'en', num: 8 })
      });
      const data = await resp.json();
      const items = Array.isArray(data?.organic) ? data.organic.slice(0, 8).map(i => ({
        title: i.title,
        url: i.link,
        snippet: i.snippet
      })) : [];
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) };
    }

    // Fallback
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [] }) };
  } catch (e) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [] }) };
  }
};
