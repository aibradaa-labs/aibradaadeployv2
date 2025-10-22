// Netlify Function: Gemini proxy (no API keys in client)
// Endpoint: /.netlify/functions/ai?model=gemini-1.5-pro
// Method: POST
// Body: { input: string|object, meta?: { source?: string } }

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ ok: false, error: 'method_not_allowed' }) };
  }

  const keySources = [
    'GEMINI_API_KEY',
    'GOOGLE_API_KEY',
    'GOOGLE_GENAI_KEY',
    'GOOGLE_GENERATIVE_LANGUAGE_API_KEY',
    'GENERATIVE_LANGUAGE_API_KEY'
  ];
  const apiKey = keySources.map(name => process.env[name]).find(Boolean);
  if (!apiKey) {
    console.error('[ai] missing API key. Checked env vars:', keySources.join(', '));
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ ok: false, error: 'missing_server_key', checked: keySources })
    };
  }

  try {
    const qp = event.queryStringParameters || {};
    const model = (qp.model || 'gemini-1.5-pro').trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }
    const input = body.input;

    // Normalize input to Gemini contents format
    const contents = (() => {
      if (!input) return [{ role: 'user', parts: [{ text: '' }] }];
      if (typeof input === 'string') return [{ role: 'user', parts: [{ text: input }]}];
      if (typeof input === 'object' && Array.isArray(input.contents)) return input.contents;
      if (typeof input === 'object' && typeof input.text === 'string') return [{ role: 'user', parts: [{ text: input.text }]}];
      return [{ role: 'user', parts: [{ text: JSON.stringify(input) }]}];
    })();

    const genCfg = (typeof body.generationConfig === 'object' && body.generationConfig) ? body.generationConfig : undefined;
    const payload = genCfg ? { contents, generationConfig: genCfg } : { contents };

    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { statusCode: res.status, headers: HEADERS, body: JSON.stringify({ ok: false, model, error: data }) };
    }

    // Extract primary text if available
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('\n\n');
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, model, data, text }) };
  } catch (err) {
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ ok: false, error: String(err && err.message || err) }) };
  }
};

