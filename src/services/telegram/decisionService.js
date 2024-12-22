
import { CONFIG } from "./config.js";
const IMAGE_INTERVAL = CONFIG.IMAGE_INTERVAL || 60 * 60 * 1000; // 1 hour

// ----------------------------------------------------
// region: Decision Service
// ----------------------------------------------------
export class DecisionService {
    constructor(openai) {
      this.openai = openai;
    }
  
    /**
     * Decide if Bob the Snake should respond.
     */
    async shouldBobRespond(combinedMessages) {
      // Quick heuristic check for name "bob"
      if (combinedMessages.toLowerCase().includes('bob')) {
        return true;
      }
  
      const memory = await loadMemory();
      const messages = [
        {
          role: 'system',
          content: 'You are Bob the Obsequious snake\'s executive function. You ONLY respond with YES or NO'
        },
        { role: 'assistant', content: `Here is what I remember:${memory}` },
        {
          role: 'user',
          content: `
            ${combinedMessages}
            \n\nIs Bob the Snake part of this discussion and would it be appropriate for him to respond? Answer YES or NO.
          `
        }
      ];
  
      const respondDecider = await this.openai.chat.completions.create({
        model: CONFIG.AI.TEXT_MODEL_SMALL,
        messages,
        max_tokens: 1,
        temperature: 0.7
      });
  
      const response = respondDecider?.choices[0]?.message?.content?.toUpperCase() || '';
      return response === 'YES';
    }
  
    /**
     * Decide if the conversation calls for an image (based on user request or time).
     */
    async shouldGenerateImage(combinedMessages, lastImageTime =  Date.now()) {
      // Time gating
      if (Date.now() - lastImageTime < IMAGE_INTERVAL) {
        return false;
      }
  
      // Random gating (40% chance)
      if (Math.random() >= 0.4) {
        return false;
      }
  
      // Check if user explicitly asked for an image
      const decisionMessages = [
        { role: 'system', content: 'You are a YES or NO decider. You ONLY respond with YES or NO' },
        {
          role: 'user',
          content:
            combinedMessages + '\n\nHas someone asked for a drawing or image or meme? Reply "YES" or "NO"'
        }
      ];
  
      const decision = await this.openai.chat.completions.create({
        model: CONFIG.AI.TEXT_MODEL_SMALL,
        messages: decisionMessages,
        max_tokens: 1,
        temperature: 0.5
      });
  
      const response = decision?.choices[0]?.message?.content?.toUpperCase() || '';
      return response === 'YES';
    }
  }
  // ----------------------------------------------------
  // endregion
  // ----------------------------------------------------
  