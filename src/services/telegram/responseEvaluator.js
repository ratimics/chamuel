
import OpenAI from 'openai';
import { CONFIG } from '../../config/index.js';

export class ResponseEvaluator {
  static async shouldRespond(context, currentSummary) {
    const openai = new OpenAI(CONFIG.OPENAI_CONFIG);
    
    const prompt = `Based on the current conversation context and bot's memory summary, determine if a response is appropriate.
    
Current Summary: ${currentSummary}
Recent Context: ${context}

Respond only with "YES" or "NO".
Consider:
1. Is the message directed at or relevant to the bot?
2. Has enough time passed since the last response?
3. Would a response add value to the conversation?
`;

    const response = await openai.chat.completions.create({
      model: CONFIG.AI.TEXT_MODEL,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: "Should the bot respond?" }
      ],
      temperature: 0.7,
      max_tokens: 5
    });

    return response.choices[0].message.content.trim() === "YES";
  }
}
