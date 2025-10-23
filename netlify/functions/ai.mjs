export const config = { path: '/ai' };

export async function handler(event) {
  try {
    if (event.httpMethod && event.httpMethod !== 'POST') {
      return fail(405, 'method_not_allowed');
    }

    const params = new URLSearchParams(event.rawUrl?.split('?')[1] || '');
    const provider = params.get('provider') || 'gemini';
    const model = params.get('model') || 'gemini-2.5-pro';
    const body = event.body ? safeParse(event.body) : {};

    const keys = {
      gemini: process.env.GEMINI_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY
    };

    if (!keys[provider]) {
      return ok({ ok: true, mocked: true, provider, model, reason: `no ${provider} key` });
    }

    const result = await routeToProvider({ provider, model, body, keys });
    return ok({ ok: true, provider, model, ...result });
  } catch (error) {
    const message = error?.message || String(error);
    return fail(500, message);
  }
}

async function routeToProvider({ provider, model, body, keys }) {
  if (provider === 'gemini') {
    const prompt = typeof body?.prompt === 'string' ? body.prompt : '';
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(keys.gemini)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { mocked: false, error: `gemini_${response.status}`, raw: json };
    }

    const text = extractText(json);
    return { mocked: false, raw: json, output: { text } };
  }

  return { mocked: true, reason: 'provider not implemented' };
}

function extractText(json) {
  try {
    const parts = json?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      return parts.map((part) => part?.text).filter(Boolean).join('\n\n');
    }
  } catch (error) {
    // no-op — fall through to default text below
  }
  return '';
}

function safeParse(payload) {
  try {
    return JSON.parse(payload);
  } catch (error) {
    return {};
  }
}

function ok(data) {
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data)
  };
}

function fail(status, message) {
  return {
    statusCode: status,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ok: false, error: message })
  };
}
