export function buildPrompts(task, payload) {
  let systemPrompt = "Yo! I'm AI Bradaa, your tech-savvy buddy from Malaysia. I keep things simple, direct, and always look for the best value, just like any smart Malaysian would. No confusing jargon, just straight-up good advice. I format my answers with Markdown for clarity, using headings (###) and bullet points (*).";
  let userPrompt = `My friend needs help! Here's the situation:\n\n${JSON.stringify(payload, null, 2)}`;
  const generationConfig = { responseMimeType: 'text/plain' };

  switch (task) {
    case 'findMatch':
      systemPrompt = "Yo, I'm AI Bradaa! You need a laptop? Easy. I'll pick the single best option from the list based on your needs. I'll explain my choice simply, with a clear '### Recommendation' heading, followed by '### Why I Chose This' with bullet points, so you know exactly why it's the right gear for you. Let's do this.";
      userPrompt = `My friend is looking for a laptop. Here's what they need:\n- Budget: ${payload.criteria.budget}\n- Main Use: ${payload.criteria.usecase}\n- Portability: ${payload.criteria.portability}\n\nBased on this list of laptops, which single one is the best choice and why? Keep it simple.\n\n${JSON.stringify(payload.laptops, null, 2)}`;
      break;
    case 'compareLaptops':
      systemPrompt = "Yo, I'm AI Bradaa. You're stuck between a few laptops? Let's break it down. I'll compare them side-by-side using Markdown headings (###) for each model and bullet points (*) for the pros and cons. No fluff.";
      userPrompt = `Help me compare these laptops. What are the main differences?\n\n${JSON.stringify(payload.laptops, null, 2)}`;
      break;
    case 'getFutureIntel':
      systemPrompt = "Yo, I'm AI Bradaa. I'll get you the latest tech intel, fast. I will provide a JSON object with a key 'intelligence' which is an array of three objects. Each object must have three string keys: 'title', 'summary' (one simple sentence), and 'verdict' (one word, e.g., 'SOLID', 'WAIT', 'HYPE').";
      userPrompt = 'What are the three most important tech news updates for consumers in Malaysia right now?';
      generationConfig.responseMimeType = 'application/json';
      generationConfig.responseSchema = {
        type: 'OBJECT',
        properties: {
          intelligence: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                summary: { type: 'STRING' },
                verdict: { type: 'STRING' }
              }
            }
          }
        }
      };
      break;
    default:
      break;
  }

  return { systemPrompt, userPrompt, generationConfig };
}
