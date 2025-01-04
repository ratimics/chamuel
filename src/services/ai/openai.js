
const HYPERBOLIC_URL = 'https://api.hyperbolic.xyz/v1/chat/completions';
const MODEL = 'meta-llama/Llama-3.3-70B-Instruct';

export async function createChatCompletion(messages, options = {}) {
  const response = await fetch(HYPERBOLIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.HYPERBOLIC_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: options.max_tokens || 512,
      temperature: options.temperature || 0.7,
      top_p: options.top_p || 0.9,
      stream: false
    })
  });

  const json = await response.json();
  return json.choices[0].message.content;
}

// Compatibility wrapper for existing code
export function createOpenAIClient() {
  return {
    chat: {
      completions: {
        create: async ({ messages, ...options }) => ({
          choices: [{
            message: {
              content: await createChatCompletion(messages, options)
            }
          }]
        })
      }
    }
  };
}
