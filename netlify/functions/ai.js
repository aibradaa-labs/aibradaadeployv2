// Netlify Function: Gemini proxy (no API keys in client)
// Endpoint: /.netlify/functions/ai?model=gemini-1.5-pro
// Method: POST
// Body: { input: string|object, meta?: { source?: string } }

exports.config = { path: '/ai' };

exports.handler = async (event, context) => {
  const module = await import('./ai.mjs');
  return module.handler(event, context);
};
