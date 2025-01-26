// xService.js

//--------------------------------------
// Imports
//--------------------------------------
import process from "process";
import { Buffer } from "buffer";
import sharp from "sharp";
import { TwitterApi } from "twitter-api-v2";
import { OpenAI } from "openai";

import { SYSTEM_PROMPT, CONFIG } from "../../config/index.js";
import { retry } from "../../utils/retry.js";

//--------------------------------------
// Validate Environment Variables
//--------------------------------------
if (!process.env.OPENAI_API_URL || !process.env.OPENAI_API_KEY) {
  throw new Error("Missing required environment variables for OpenAI API.");
}
if (CONFIG.X_POST_CHANCE < 0 || CONFIG.X_POST_CHANCE > 1) {
  throw new Error(
    "Invalid CONFIG.X_POST_CHANCE value. Must be between 0 and 1.",
  );
}

export class XService {
  static #client;
  static #openai;
  static #rateLimitReset = 0;
  static #lastPostTime = 0;

  static initialize() {
    if (!XService.#client) {
      XService.#client = new TwitterApi({
        appKey: process.env.X_API_KEY,
        appSecret: process.env.X_API_KEY_SECRET,
        accessToken: process.env.X_ACCESS_TOKEN,
        accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
      });

      XService.#openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return XService.#client;
  }

  //--------------------------------------
  // Private Utility Methods
  //--------------------------------------
  static #chunkText(text, chunkSize = 280) {
    const paragraphs = text.split("\n\n");
    const chunks = [];
    let currentChunk = "";

    for (const paragraph of paragraphs) {
      const lines = paragraph.split("\n");

      for (const line of lines) {
        if (currentChunk.length + line.length + 1 > chunkSize) {
          if (currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = "";
          }

          if (line.length > chunkSize) {
            const words = line.split(" ");
            for (const word of words) {
              if (currentChunk.length + word.length + 1 > chunkSize) {
                chunks.push(currentChunk.trim());
                currentChunk = word;
              } else {
                currentChunk += ` ${word}`;
              }
            }
          } else {
            currentChunk += ` ${line}\n`;
          }
        } else {
          currentChunk += ` ${line}\n`;
        }
      }

      chunks.push(currentChunk.trim());
      currentChunk = "";
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  static #delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async #uploadImageBuffer(imageBuffer, type = "png") {
    while (imageBuffer.length > 5242880) {
      console.log("🌳 Resizing image buffer...");

      const metadata = await sharp(imageBuffer).metadata();
      const newWidth = Math.floor(metadata.width * 0.8);
      const newHeight = Math.floor(metadata.height * 0.8);

      imageBuffer = await sharp(imageBuffer)
        .resize(newWidth, newHeight)
        .toBuffer();
    }

    try {
      const mediaId = await XService.#client.v1.uploadMedia(
        Buffer.from(imageBuffer),
        { mimeType: `image/${type}` },
      );
      console.log("🌳 Image uploaded successfully:", mediaId);
      return mediaId;
    } catch (error) {
      console.error("🌳 Error uploading image:", error);
      throw error;
    }
  }

  //--------------------------------------
  // Public Methods
  //--------------------------------------

  static async post(params, retryCount = 3) {
    if (!XService.#client) XService.initialize();

    return await retry(async () => {
      try {
        const response = await XService.#client.v2.tweet(params);
        console.log('🌳 Tweet posted successfully:', response);
        return response;
      } catch (error) {
        if (error.rateLimit) {
          XService.#rateLimitReset = Date.now() + (error.rateLimit.reset * 1000);
          throw new Error(`Rate limit exceeded. Reset at ${new Date(XService.#rateLimitReset)}`);
        }
        throw error;
      }
    }, retryCount);
  }

  static async maybePostImage(imageBuffer, imagePrompt, type = "png") {
    if (Date.now() - XService.#lastPostTime < CONFIG.XPOST_INTERVAL) {
      return null;
    }

    if (Math.random() >= CONFIG.X_POST_CHANCE) {
      return null;
    }

    try {
      // Image processing
      while (imageBuffer.length > 5242880) {
        const metadata = await sharp(imageBuffer).metadata();
        imageBuffer = await sharp(imageBuffer)
          .resize(Math.floor(metadata.width * 0.8), Math.floor(metadata.height * 0.8))
          .toBuffer();
      }

      // Generate tweet text
      const tweetResponse = await XService.#openai.chat.completions.create({
        model: CONFIG.AI.TEXT_MODEL,
        messages: [
          { role: "system", content: CONFIG.SYSTEM_PROMPT },
          { role: "assistant", content: `Generated image with prompt: ${imagePrompt}` },
          { role: "user", content: "Write a tweet for this image." }
        ],
        max_tokens: 128,
        temperature: 0.8,
      });

      const tweetText = tweetResponse.choices[0]?.message?.content?.trim() || "Check out this image!";
      const mediaId = await XService.#client.v1.uploadMedia(Buffer.from(imageBuffer), {
        mimeType: `image/${type}`
      });

      const tweet = await XService.post({
        text: tweetText,
        media: { media_ids: [mediaId] }
      });

      XService.#lastPostTime = Date.now();

      return {
        text: tweetText,
        url: `https://x.com/status/${tweet.data.id}`
      };

    } catch (error) {
      console.error('Error posting image to X:', error);
      return null;
    }
  }

  /**
   * Polls the Twitter/X API for replies to a given tweet ID (aka a conversation).
   * Calls a callback with new replies each time it finds them.
   *
   * @param {string} tweetId         - The ID of the tweet to watch.
   * @param {string | null} sinceId  - Only fetch replies more recent than this tweet ID (if any).
   * @param {number} intervalMs      - How many ms to wait between each poll cycle (default 60s).
   * @param {Function} onNewReplies  - A callback invoked with an array of new replies when found.
   * 
   * @example
   * XService.pollForReplies('1234567890', null, 30000, (replies) => {
   *   console.log('Got new replies:', replies);
   * });
   */
  static async pollForReplies(
    tweetId,
    sinceId = null,
    intervalMs = 60000,
    onNewReplies = () => {}
  ) {
    // Keep track of the 'latest' tweet ID we've seen so we only fetch new replies
    let lastSinceId = sinceId;

    // Optional: If we don't have a sinceId, we can initialize it with the original tweet's ID
    // so we don't retrieve older replies
    if (!lastSinceId) {
      lastSinceId = tweetId;
    }

    // We could run indefinitely, or until some external stop signal is given
    // For demonstration, this while(true) can be replaced by your own loop control
    while (true) {
      try {
        // Build a Twitter search query:
        // "conversation_id:<tweetId> is:reply -is:retweet" means
        //   all tweets that have <tweetId> as conversation
        //   must be a reply
        //   exclude retweets
        // Optionally, we add "since_id:<lastSinceId>" to only get newer tweets
        let query = `conversation_id:${tweetId} is:reply -is:retweet`;
        if (lastSinceId) {
          query += ` since_id:${lastSinceId}`;
        }

        // Make the search request
        // We can expand author_id or other expansions if we want user info
        const searchResponse = await XService.#client.v2.search(query, {
          max_results: 50,
          expansions: "author_id",
        });

        // If there's no data, just skip
        if (!searchResponse || !searchResponse.data || !searchResponse.data.data) {
          await XService.#delay(intervalMs);
          continue;
        }

        const newReplies = searchResponse.data.data;
        if (newReplies.length > 0) {
          // Sort them by ID to ensure we update lastSinceId to the highest
          // If you want chronological order, sort by created_at (needs expansions).
          newReplies.sort((a, b) => Number(a.id) - Number(b.id));

          // The last reply ID becomes our new reference point
          lastSinceId = newReplies[newReplies.length - 1].id;

          // Invoke the callback with the newly found replies
          onNewReplies(newReplies);
        }

        // Wait before the next polling cycle
        await XService.#delay(intervalMs);

      } catch (error) {
        console.error("Error polling for replies:", error);

        // Wait before retrying after an error
        await XService.#delay(intervalMs);
      }
    }
  }
}