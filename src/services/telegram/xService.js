import { SYSTEM_PROMPT, CONFIG } from '../../config/index.js';
import { retry } from '../../utils/retry.js';
import { OpenAI } from 'openai';
import { postX } from '../x/x.js'

const openai = new OpenAI({
  baseURL: process.env.OPENAI_API_URL,
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.YOUR_SITE_URL,
    'X-Title': process.env.YOUR_SITE_NAME
  }
});

// Validate necessary environment variables
if (!process.env.OPENAI_API_URL || !process.env.OPENAI_API_KEY) {
  throw new Error('Missing required environment variables for OpenAI API.');
}
if (CONFIG.X_POST_CHANCE < 0 || CONFIG.X_POST_CHANCE > 1) {
  throw new Error('Invalid CONFIG.X_POST_CHANCE value. Must be between 0 and 1.');
}

let lastPostTime = 0;

// ----------------------------------------------------
// region: X (Twitter) Service
// ----------------------------------------------------
export class XService {
  static async maybePostImage(imageBuffer, imagePrompt, type = 'png') {
    // Time gating
    if (Date.now() - lastPostTime < CONFIG.XPOST_INTERVAL) {
      return null;
    }

    // Random gating
    if (Math.random() >= CONFIG.X_POST_CHANCE) {
      return null;
    }

    try {
      // Generate tweet text using OpenAI
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

      let tweetText = tweetResponse.choices?.[0]?.message?.content?.trim();
      if (!tweetText) {
        console.warn('Failed to generate tweet text; using default.');
        tweetText = 'Checkout my new image!';
      }

      // Post to X (Twitter) with retry logic
      const tweetResult = await retry(() => postX({ text: tweetText }, '', imageBuffer, type), 2);

      if (!tweetResult?.id) {
        console.error('Failed to post the image after retries.');
        return null;
      }

      // Update last post time after a successful post
      lastPostTime = Date.now();

      // Return tweet text and URL
      const tweetURL = `${process.env.X_BASE_URL || 'https://x.com'}/bobthesnek/status/${tweetResult.id}`;
      return {
        text: tweetText,
        url: tweetURL
      };
    } catch (error) {
      console.error('An error occurred during the post process:', error);
      return null;
    }
  }
}
// ----------------------------------------------------
// endregion
// ----------------------------------------------------
