export async function callAI({ provider = 'gemini', model = 'gemini-2.5-pro', payload = {}, timeoutMs = 15000 } = {}) {
  const hasAnyKey = Boolean(
    typeof process !== 'undefined' && process?.env && (
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY
    )
  );

  const isBrowser = typeof window !== 'undefined' && typeof location !== 'undefined';
  const inNetlifyDev = isBrowser && location?.pathname?.startsWith('/') && location?.host?.includes('localhost');
  const shouldMock = !hasAnyKey || !inNetlifyDev;

  if (shouldMock) {
    return mockReply({ provider, model, payload });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const origin = isBrowser ? location.origin : 'http://localhost:8888';
    const url = new URL('/.netlify/functions/ai', origin);
    url.searchParams.set('model', model || '');
    url.searchParams.set('provider', provider || '');

    const res = await fetch(url.toString(), {
      method: 'POST',
      body: JSON.stringify(payload || {}),
      headers: { 'content-type': 'application/json' },
      signal: controller.signal
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`ai ${res.status}${text ? ` ${text}` : ''}`.trim());
    }

    return await res.json();
  } catch (error) {
    return mockReply({ provider, model, payload, error: error?.message || String(error) });
  } finally {
    clearTimeout(timer);
  }
}

function mockReply({ provider = 'mock', model = 'mock', payload = {}, error }) {
  return {
    ok: true,
    provider,
    model,
    latency_ms: 5,
    mocked: true,
    error: error || null,
    output: {
      text: '[dev/mock] AI disabled or keys missing',
      echo: payload
    }
  };
}

if (typeof window !== 'undefined') {
  window.AI_POD = window.AI_POD || {};
  window.AI_POD.callAI = callAI;
}
