


// ----------------------------------------------------
// region: X (Twitter) Service
// ----------------------------------------------------
export class XService {
    static async maybePostImage(imageBuffer, openai, imagePrompt, type = 'png') {
      // Time gating
      if (Date.now() - lastPostTime < XPOST_INTERVAL) {
        return null;
      }
      // Random gating
      if (Math.random() >= X_POST_CHANCE) {
        return null;
      }
  
      lastPostTime = Date.now();
  
      // Generate tweet text
      const tweetResponse = await openai.chat.completions.create({
        model: CONFIG.AI.TEXT_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'assistant', content: `I generated an image with prompt: ${imagePrompt}` },
          { role: 'user', content: 'Write a tweet to go along with the image you generated.' }
        ],
        max_tokens: 128,
        temperature: 0.8
      });
  
      const tweetText = tweetResponse.choices[0]?.message?.content?.trim() || 'Checkout my new image!';
      
      // Post to X with retry
      const tweetResult = await retry(() => postX({ text: tweetText }, '', imageBuffer, type), 2);
      if (!tweetResult?.id) return null;
  
      return {
        text: tweetText,
        url: `https://x.com/bobthesnek/status/${tweetResult.id}`
      };
    }
  }
  // ----------------------------------------------------
  // endregion
  // ----------------------------------------------------
  