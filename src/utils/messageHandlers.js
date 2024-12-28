import mongoDBService from "../services/mongodb/mongodb.js";
import { handleText } from "../services/telegram/orchestrator.js";
import { MessageQueue } from "./messageQueue.js";
import xPostCapture from "../services/social/xPostCapture.js";

import { CONFIG } from "../config/index.js";
import { sendTextMessage, sendGif, sendImage } from "./mediaHandlers.js";
// Add image cache
const imageCache = new Map();

const maxConsecutiveErrors = CONFIG.BOT.MAX_CONSECUTIVE_ERRORS || 5;
let consecutiveErrors = 0;

// Helper function to get image description
async function getImageDescription(bot, openai, fileId) {
  try {
    // Check cache first
    if (imageCache.has(fileId)) {
      return imageCache.get(fileId);
    }

    // Get file path from Telegram
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${file.file_path}`;

    // Get description from vision model
    const response = await openai.chat.completions.create({
      model: CONFIG.AI.VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "What's in this image? Describe it briefly.",
            },
            { type: "image_url", image_url: { url: fileUrl } },
          ],
        },
      ],
      max_tokens: 128,
    });

    const description = response.choices[0].message.content;

    // Cache the result
    imageCache.set(fileId, description);

    return description;
  } catch (error) {
    console.error("Error getting image description:", error);
    return "Unable to describe image";
  }
}

const messageQueue = new MessageQueue();
let processingInterval;

// Add circuit breaker state
const circuitBreaker = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
  timeout: 5 * 60 * 1000, // 5 minutes
  maxFailures: 10,
};

// Reset circuit breaker
function resetCircuitBreaker() {
  circuitBreaker.failures = 0;
  circuitBreaker.lastFailure = 0;
  circuitBreaker.isOpen = false;
}

// Check if circuit is open
function isCircuitOpen() {
  if (!circuitBreaker.isOpen) return false;

  // Check if timeout has passed
  if (Date.now() - circuitBreaker.lastFailure > circuitBreaker.timeout) {
    resetCircuitBreaker();
    return false;
  }
  return true;
}

export async function setupMessageHandlers(bot, openai) {
  try {
    // Initialize xPostCapture
    await xPostCapture.initialize();

    // Start message processing loop
    startMessageProcessing(bot, openai);

    bot.on("message", async (msg) => {
      try {
        const chatId = msg.chat.id;

        // if it contains a Ca ignore it
        if (msg.text && msg.text.toLowerCase().includes("ca")) {
          return;
        }

        // if it contains a word ending in pump ignore it
        if (
          msg.text &&
          msg.text
            .toLowerCase()
            .split(" ")
            .some((word) => word.endsWith("pump"))
        ) {
          return;
        }

        // Check for X.com status URLs
        if (msg.text && xPostCapture.isXStatusUrl(msg.text)) {
          try {
            const capturedPost = await xPostCapture.capturePost(msg);
            if (capturedPost) {
              console.log("Captured X post:", capturedPost.postId);
            }
          } catch (error) {
            console.error("Error capturing X post:", error);
          }
        }

        // Continue with existing message handling
        if (msg.photo || msg.text) {
          messageQueue.addMessage(chatId, msg);
          await logMessage(chatId, msg, bot, openai);
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    });
  } catch (error) {
    console.error("Error in setupMessageHandlers:", error);
    throw error;
  }
}

// Update logMessage function to handle images
async function logMessage(chatId, msg, bot, openai) {
  try {
    const userId = msg.from.id;
    const username =
      msg.from.username ||
      `${msg.from.first_name} ${msg.from.last_name || ""}`.trim();
    const location = msg.location
      ? `${msg.location.latitude}, ${msg.location.longitude}`
      : "Unknown Location";

    let content = [];
    if (msg.photo) {
      const photo = msg.photo[msg.photo.length - 1];
      const description = await getImageDescription(bot, openai, photo.file_id);
      content.push(
        { type: "text", text: msg.caption || "Shared an image:" },
        { type: "image_description", text: description },
      );
    } else if (msg.text) {
      content.push({ type: "text", text: msg.text });
    }

    // Store message in MongoDB
    await mongoDBService.getCollection("messages").insertOne({
      chatId,
      userId,
      username,
      location,
      content,
      role: "user",
      timestamp: Date.now(),
    });

    // Clean up old messages
    const oldMessagesCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
    await mongoDBService.getCollection("messages").deleteMany({
      chatId,
      timestamp: { $lt: oldMessagesCutoff },
    });
  } catch (error) {
    console.error("Error logging message:", error);
    throw error;
  }
}

// Add error handling utilities
const handleError = (error, chatId) => {
  if (error.code === "ETELEGRAM") {
    if (error.message.includes("409 Conflict")) {
      console.error(
        "409 Conflict: Another bot instance is running. Shutting down.",
      );
      process.exit(1); // Exit the process
    }
    if (
      error.message.includes("ECONNRESET") ||
      error.message.includes("EFATAL")
    ) {
      console.warn(
        `Connection error for chat ${chatId}, will retry: ${error.message}`,
      );
      return true; // Should retry
    }
    if (error.message.includes("CHAT_WRITE_FORBIDDEN")) {
      console.warn(
        `Write access forbidden for chat ${chatId}: ${error.message}`,
      );
      return false; // Should retry
    }
    if (error.message.includes("ETELEGRAM") || error.code === 429) {
      console.warn(`Rate limit hit for chat ${chatId}: ${error.message}`);
      if (error.message === "CHAT_WRITE_FORBIDDEN") {
        return false;
      }
      return true; // Should retry
    }
  }
  console.error(`Unhandled error for chat ${chatId}:`, error.message);
  return false; // Don't retry unknown errors
};

// Add jitter to prevent thundering herd
const getBackoffDelay = (retryCount, baseDelay = 1000, maxDelay = 30000) => {
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  return delay + Math.random() * 1000; // Add random jitter
};

// Flag to ensure only one processing loop is active
let isProcessingLoopActive = false;

// Fixes in processNextMessage function
async function processNextMessage(bot, openai, chatId) {
  if (isCircuitOpen()) {
    console.warn("Circuit breaker is open, skipping message processing");
    return { continue: false }; // Added consistent return
  }

  let retryCount = 0;
  const maxRetries = CONFIG.BOT.RECONNECT_ATTEMPTS;

  const attempt = async () => {
    try {
      if (retryCount > 0) {
        const delay = getBackoffDelay(retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Check if there are unprocessed messages
      const lastMessage = await mongoDBService
        .getCollection("messages")
        .find({ chatId })
        .sort({ timestamp: -1 })
        .limit(1)
        .toArray();

      if (!lastMessage.length || lastMessage[0].role === "assistant") {
        return;
      }

      const processLoop = async (remainingCycles = 3) => {
        if (remainingCycles <= 0) return;

        const response = await handleText(chatId, openai, bot);

        // Store assistant's response in MongoDB
        await mongoDBService.getCollection("messages").insertOne({
          chatId,
          content: [
            { type: "text", text: response.text, imageUrl: response.imageUrl },
          ],
          role: "assistant",
          timestamp: Date.now(),
        });

        // Handle regular responses
        if (response.text) {
          await sendTextMessage(bot, chatId, response.text);
        }

        // Handle media responses
        if (response.filePath && !response.pendingImage) {
          const ext = response.filePath.split(".").pop().toLowerCase();
          try {
            if (ext === "gif") {
              await sendGif(bot, chatId, response.imageUrl);
            } else if (["png", "jpg", "jpeg"].includes(ext)) {
              await sendImage(bot, chatId, response.imageUrl);
            }
          } catch (error) {
            console.error(`Failed to send media: ${error.message}`);
          }
        }

        if (response.continue && !response.pendingImage) {
          return processLoop(remainingCycles - 1);
        }
      };

      await processLoop();

      // Reset circuit breaker on success
      resetCircuitBreaker();
      consecutiveErrors = 0; // Reset consecutive errors on success
    } catch (error) {
      lastError = error;

      if (handleError(error, chatId)) {
        circuitBreaker.failures++;
        circuitBreaker.lastFailure = Date.now();

        if (circuitBreaker.failures >= circuitBreaker.maxFailures) {
          circuitBreaker.isOpen = true;
          console.error(
            "Circuit breaker opened due to persistent connection failures",
          );
          return { continue: false };
        }

        if (retryCount < maxRetries) {
          retryCount++;
          console.warn(`Connection error, attempt ${retryCount}/${maxRetries}`);
          return await attempt();
        }
      }

      throw error;
    }
  };

  try {
    return await attempt();
  } catch (error) {
    console.error(
      `Error processing messages for chat ${chatId}: ${error.message}`,
    );
    // Return a consistent error response
    return { continue: false, error: error.message };
  }
}

// Fix in startMessageProcessing function
async function startMessageProcessing(bot, openai) {
  if (isProcessingLoopActive) {
    console.warn("Message processing loop is already active.");
    return;
  }

  if (processingInterval) clearTimeout(processingInterval);

  isProcessingLoopActive = true;

  async function process() {
    if (!isProcessingLoopActive) {
      console.warn("Message processing loop has been stopped.");
      return;
    }

    if (isCircuitOpen()) {
      console.warn("Circuit breaker is open, skipping processing cycle");
    } else {
      const chats = messageQueue.getAllChats();

      for (const chatId of chats) {
        try {
          await processNextMessage(bot, openai, chatId);

          messageQueue.removeMessage(chatId); // Remove processed message
        } catch (error) {
          consecutiveErrors++;
          console.error(
            `Error processing messages for chat ${chatId}: ${error.message}`,
          );
          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.error(
              "Too many consecutive errors, restarting processing...",
            );
            stopMessageProcessing();
            consecutiveErrors = 0;
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Add delay before restart
            startMessageProcessing(bot, openai);
            return;
          }
        }
      }
    }

    processingInterval = setTimeout(
      async () => await process(),
      CONFIG.BOT.POLLING_INTERVAL || 33333,
    );
  }

  processingInterval = setTimeout(async () => await process(), 1000);
}

// Add message queue cleanup
function cleanupMessageQueue() {
  const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
  messageQueue.cleanup(cutoffTime);
}

// Add periodic cleanup
setInterval(cleanupMessageQueue, 60 * 60 * 1000); // Run every hour

export function stopMessageProcessing() {
  if (processingInterval) {
    clearTimeout(processingInterval);
    processingInterval = null;
    isProcessingLoopActive = false;
    console.warn("Message processing loop has been stopped.");
  }
}
