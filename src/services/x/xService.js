// xService.js

//--------------------------------------
// Imports
//--------------------------------------
import process from "process";
import { Buffer } from "buffer";
import sharp from "sharp";
import { TwitterApi } from "twitter-api-v2";

import { SYSTEM_PROMPT, CONFIG } from "../../config/index.js";
import { retry } from "../../utils/retry.js";
import { OpenAI } from "openai";

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
  // Private static fields for rate limit tracking, last post time, etc.
  static #rateLimitReset = 0;
  static #lastPostTime = 0;

  // Instantiate our OpenAI and TwitterApi clients just once
  static #openai = new OpenAI({
    baseURL: process.env.OPENAI_API_URL,
    apiKey: process.env.OPENAI_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": process.env.YOUR_SITE_URL,
      "X-Title": process.env.YOUR_SITE_NAME,
    },
  });

  static #xClient = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_KEY_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
  });

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
      const mediaId = await XService.#xClient.v1.uploadMedia(
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

  /**
   * Posts one or more tweets, optionally including an image, as a thread.
   * @param {Object} params - Tweet parameters (must include `text`).
   * @param {string} accountId - If provided, the tweet(s) will reply to this tweetId (thread).
   * @param {Buffer|null} imageBuffer - If provided, includes an image as the first tweet's media.
   * @param {string} [type="png"] - The image format.
   * @returns {Promise<{ id: string | null }>} The final tweet ID or null if it failed.
   */
  static async post(params, accountId = "", imageBuffer = null, type = "png") {
    const { text, ...otherParams } = params;
    const tweetChunks = XService.#chunkText(text || "");

    // Rate-limit check
    if (Date.now() < XService.#rateLimitReset) {
      console.log(
        `🌳 Rate limit exceeded, retrying in ${XService.#rateLimitReset} seconds...`,
      );
      return null;
    }

    let inReplyToTweetId = accountId || null;
    const maxRetries = 3;
    let mediaId = null;

    // If an image is provided, upload it
    if (imageBuffer) {
      try {
        mediaId = await XService.#uploadImageBuffer(imageBuffer, type);
      } catch (error) {
        console.error("🌳 Failed to upload image, proceeding without it.");
        console.error(error);
      }
    }

    let index = 0;
    for (const chunk of tweetChunks) {
      let success = false;
      let attempt = 0;

      // Delay between posting each chunk (thread)
      await XService.#delay(5000);

      while (attempt < maxRetries && !success) {
        try {
          const tweetPayload = {
            text: chunk,
            ...otherParams,
            reply: inReplyToTweetId
              ? { in_reply_to_tweet_id: inReplyToTweetId }
              : undefined,
          };

          // Attach mediaId if available and it's the first chunk
          if (mediaId && index === 0) {
            tweetPayload.media = { media_ids: [mediaId] };
          }

          const response = await XService.#xClient.v2.tweet(tweetPayload);
          console.log("🌳 Tweet posted successfully:", response);

          // Use the newly posted tweet ID for the next tweet in the thread
          inReplyToTweetId = response.data.id;
          success = true;
        } catch (error) {
          attempt++;
          console.error(
            `🌳 Error posting tweet (Attempt ${attempt}/${maxRetries}):`,
            error,
          );
          if (attempt < maxRetries && error.rateLimit && error.rateLimit.reset) {
            console.log(
              `🌳 Rate limit exceeded, retrying in ${error.rateLimit.reset} seconds...`,
            );
            XService.#rateLimitReset = error.rateLimit.reset;
            break; // Exit the retry loop to wait for the next attempt
          } else {
            console.error(
              "🌳 Failed to post tweet after multiple attempts. Exiting...",
            );
            break;
          }
        }
      }

      if (!success) {
        // Stop posting subsequent chunks if the current chunk fails
        break;
      }
      index++;
    }

    return { id: inReplyToTweetId };
  }

  /**
   * Attempts to post an image to Twitter/X after verifying time and random gating.
   * Uses OpenAI to generate tweet text based on `imagePrompt`.
   * @param {Buffer} imageBuffer - Image data.
   * @param {string} imagePrompt - The prompt that was used to generate the image.
   * @param {string} [type="png"] - The image format.
   * @returns {Promise<{ text: string, url: string } | null>} The tweet text and URL, or null if not posted.
   */
  static async maybePostImage(imageBuffer, imagePrompt, type = "png") {
    // Time gating
    if (Date.now() - XService.#lastPostTime < CONFIG.XPOST_INTERVAL) {
      return null;
    }

    // Random gating
    if (Math.random() >= CONFIG.X_POST_CHANCE) {
      return null;
    }

    try {
      // Generate tweet text using OpenAI
      const tweetResponse = await XService.#openai.chat.completions.create({
        model: CONFIG.AI.TEXT_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "assistant",
            content: `I generated an image with prompt: ${imagePrompt}`,
          },
          {
            role: "user",
            content: "Write a tweet to go along with the image you generated.",
          },
        ],
        max_tokens: 128,
        temperature: 0.8,
      });

      let tweetText = tweetResponse.choices?.[0]?.message?.content?.trim();
      if (!tweetText) {
        console.warn("Failed to generate tweet text; using default.");
        tweetText = "Checkout my new image!";
      }

      // Attempt to post to Twitter/X with retry logic
      const tweetResult = await retry(
        () => XService.post({ text: tweetText }, "", imageBuffer, type),
        2,
      );

      if (!tweetResult?.id) {
        console.error("Failed to post the image after retries.");
        return null;
      }

      // Update last post time after a successful post
      XService.#lastPostTime = Date.now();

      // Build the tweet URL
      const tweetURL = `${process.env.X_BASE_URL || "https://x.com"}/bobthesnek/status/${tweetResult.id}`;
      return {
        text: tweetText,
        url: tweetURL,
      };
    } catch (error) {
      console.error("An error occurred during the post process:", error);
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
        const searchResponse = await XService.#xClient.v2.search(query, {
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
