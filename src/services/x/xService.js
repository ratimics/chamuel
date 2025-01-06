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

//--------------------------------------
// OpenAI Client
//--------------------------------------
const openai = new OpenAI({
  baseURL: process.env.OPENAI_API_URL,
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.YOUR_SITE_URL,
    "X-Title": process.env.YOUR_SITE_NAME,
  },
});

//--------------------------------------
// Twitter / X Client
//--------------------------------------
const xClient = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_KEY_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});

let rateLimitReset = 0;

//--------------------------------------
// Utility Functions
//--------------------------------------

// Splits a long text into tweet-sized chunks (<= 280 chars),
// prioritizing splitting on double line breaks.
function chunkText(text, chunkSize = 280) {
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

// A simple delay function (useful for spacing out requests).
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Uploads an image buffer to Twitter/X, resizing if larger than 5MB.
async function uploadImageBuffer(imageBuffer, type = "png") {
  // If the image Buffer exceeds 5MB, it will be resized repeatedly until below the threshold
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
    const mediaId = await xClient.v1.uploadMedia(Buffer.from(imageBuffer), {
      mimeType: `image/${type}`,
    });
    console.log("🌳 Image uploaded successfully:", mediaId);
    return mediaId;
  } catch (error) {
    console.error("🌳 Error uploading image:", error);
    throw error;
  }
}

//--------------------------------------
// The post Function
//--------------------------------------
export async function post(
  params,
  accountId = "",
  imageBuffer = null,
  type = "png",
) {
  const { text, ...otherParams } = params;
  const tweetChunks = chunkText(text || "");

  // Rate-limit check
  if (Date.now() < rateLimitReset) {
    console.log(
      `🌳 Rate limit exceeded, retrying in ${rateLimitReset} seconds...`,
    );
    return null;
  }

  let inReplyToTweetId = accountId || null;
  const maxRetries = 3;
  let mediaId = null;

  // Upload image if buffer is provided
  if (imageBuffer) {
    try {
      mediaId = await uploadImageBuffer(imageBuffer, type);
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
    await delay(5000);

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

        const response = await xClient.v2.tweet(tweetPayload);
        console.log("🌳 Tweet posted successfully:", response);

        // The newly posted tweet ID will be used for thread replies
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
          rateLimitReset = error.rateLimit.reset;
          break;
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

//--------------------------------------
// XService Class
//--------------------------------------
let lastPostTime = 0;

export class XService {
  static async maybePostImage(imageBuffer, imagePrompt, type = "png") {
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
        () => post({ text: tweetText }, "", imageBuffer, type),
        2,
      );

      if (!tweetResult?.id) {
        console.error("Failed to post the image after retries.");
        return null;
      }

      // Update last post time after a successful post
      lastPostTime = Date.now();

      // Return tweet text and URL
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
}
