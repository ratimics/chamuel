// ----------------------------------------------------
// region: Imports & Constants
// ----------------------------------------------------
import { updateMemory } from "../memory/memoryService.js";
import { retry } from "../../utils/retry.js";
import { MessageService, MediaService, XService } from "./index.js";

import { SYSTEM_PROMPT, RESPONSE_INSTRUCTIONS } from "../../config/index.js";
import EventEmitter from "events";

// ----------------------------------------------------
// endregion
// ----------------------------------------------------

// ----------------------------------------------------
// region: Actions Setup
// ----------------------------------------------------
const ACTIONS = {
  speak: {
    timeout: 3 * 10 * 1000, // 30 seconds
    description: "Respond to the conversation",
    handler: handleSpeak,
  },
  respond: {
    timeout: 3 * 10 * 1000, // 30 seconds
    description: "Respond to the conversation",
    handler: handleSpeak,
  },
  think: {
    timeout: 15 * 60 * 1000, // 5 minutes
    description: "Reflect on the context and add a persistent thought",
    handler: handleThink,
  },
  imagine: {
    timeout: 10 * 60 * 1000, // 10 minutes
    description: "Create a fun image or meme inspired by the discussion",
    handler: handleImagineBackground,
  },
  post: {
    timeout: 5 * 60 * 1000, // 5 minutes
    description: "Post a text tweet to X",
    handler: handlePost,
  },
  wait: {
    timeout: 30 * 1000, // 30 seconds
    description: "Pause and wait for someone else to contribute",
    handler: handleWait,
  },
};

const state = {
  timers: {},
  lastActionTimes: {},
};

const backgroundTasks = new EventEmitter();
// ----------------------------------------------------
// endregion
// ----------------------------------------------------

// ----------------------------------------------------
// region: Action Management
// ----------------------------------------------------
function isActionAllowed(actionName) {
  const now = Date.now();
  if (actionName === "respond") {
    actionName = "speak";
  }
  const lastUsed = state.lastActionTimes[actionName] || 0;
  const action = ACTIONS[actionName];

  if (!action) {
    console.warn(`[isActionAllowed] Unknown action requested: ${actionName}`);
    return false;
  }
  return now - lastUsed > action.timeout;
}

function updateActionTimestamp(actionName) {
  state.lastActionTimes[actionName] = Date.now();
}

function generateStructuredPrompt() {
  const availableActions = Object.entries(ACTIONS)
    .filter(([name]) => isActionAllowed(name))
    .map(([name, config]) => `- ${name}: ${config.description}`);

  return `
${SYSTEM_PROMPT}

Currently available actions:
${availableActions.join("\n")}

Choose what you want to do, and provide the relevant message. 
Only choose from the currently available actions listed above.

Always pick the action that fits best with the given context. Respond in a structured JSON format adhering strictly to the schema.
`;
}
// ----------------------------------------------------
// endregion
// ----------------------------------------------------

// ----------------------------------------------------
// region: Main Orchestrator
// ----------------------------------------------------
export async function handleText(chatId, openai, bot) {
  try {
    // Track processed messages
    if (!state.processedMessages) {
      state.processedMessages = new Set();
    }

    // 1. Retrieve chat history
    console.log("[handleText] Step 1: Retrieving chat history...");
    const history = await MessageService.fetchChatHistory(chatId, 20);
    console.log(`[handleText] Step 1: Retrieved ${history.length} messages.`);

    if (!history.length) {
      console.log("[handleText] Step 1: No history found, returning null.");
      return null;
    }

    // Check if latest message was already processed
    const latestMessage = history[history.length - 1];
    const messageKey = `${chatId}-${latestMessage.timestamp}`;
    
    if (state.processedMessages.has(messageKey)) {
      console.log("[handleText] Message already processed, skipping");
      return null;
    }
    
    state.processedMessages.add(messageKey);

      // 2. Combine messages into a single string
      console.log("[handleText] Step 2: Combining messages...");
      const combinedMessages = MessageService.combineMessages(history);

      // 3. Generate dynamic prompt based on available actions
      const structuredPrompt = generateStructuredPrompt();
      const responseInstructions = RESPONSE_INSTRUCTIONS;

      // 4. Request Structured Output for decision-making
      console.log(
        "[handleText] Step 3: Requesting structured output from LLM...",
      );
      const getValidResponse = async () => {
        const response = await openai.chat.completions.create({
          model: "nousresearch/hermes-3-llama-3.1-405b",
          messages: [
            { role: "system", content: structuredPrompt },
            {
              role: "user",
              content: combinedMessages + responseInstructions,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              type: "object",
              properties: {
                action: {
                  type: "string",
                  enum: Object.keys(ACTIONS),
                },
                message: {
                  type: "string",
                  description:
                    "The content or reasoning behind the chosen action.",
                },
              },
              required: ["action", "message"],
              additionalProperties: false,
            },
          },
          temperature: 0.8,
        });

        const parsed = JSON.parse(response.choices[0]?.message?.content) || {};

        return {
          action: parsed.action,
          message: parsed.message,
        };
      };

      // Example of inlined logic (no separate function)
      let action, message;
      const maxRetries = 5;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await getValidResponse();
          if (!response.action || !response.message) {
            throw new Error("Response is missing required properties");
          }
          action = response.action;
          message = response.message;

          if (!action || !ACTIONS[action]) {
            throw new Error("Invalid response: " + JSON.stringify(response));
          }

          break;
        } catch (error) {
          console.error(`Attempt #${attempt} failed: ${error.message}`);

          // Optional: add a small delay before next retry
          await new Promise((resolve) => setTimeout(resolve, 1000));

          if (attempt === maxRetries) {
            console.error("All attempts failed.");
          }
        }
      }

      console.log(`[handleText] Step 3: LLM chose action: ${action}`);
      console.log(`[handleText] Step 3: LLM message: ${message}`);

      // 5. Execute the chosen action if allowed
      if (!isActionAllowed(action)) {
        console.log(`[handleText] Action "${action}" is on cooldown.`);
        return await handleSpeak(
          chatId,
          bot,
          `Hiss... I need to wait a bit before I can ${action} again.`,
        );
      }

      // 6. Update action timestamp and execute handler
      updateActionTimestamp(action);

      // Execute the action handler
      return await ACTIONS[action].handler(chatId, message, bot);
    } catch (error) {
      console.error("[handleText] Caught an error:", error);
      const errorMessage = error.message || "Unknown error occurred";
      return await fallbackResponse(chatId, bot, errorMessage);
    }
  } catch (error) {
    console.error("[handleText] Unexpected error:", error);
    // Do not send anything to the chat
    return null;
  }
}

// ----------------------------------------------------
// region: Action Handlers
// ----------------------------------------------------
async function handleWait(chatId, content) {
  // We do respond, but if you prefer we can also skip
  // For now, let's store an "idle/waiting" message
  console.log("[handleWait]", content);
  await MessageService.storeAssistantMessage(chatId, [
    { type: "text", text: content },
  ]);
  return { continue: false };
}

async function handleSpeak(chatId, content) {
  console.log(
    "[handleSpeak] Sending response:",
    typeof content === "string" ? content : "Complex object",
  );
  await MessageService.storeAssistantMessage(chatId, [
    {
      type: "text",
      text: typeof content === "string" ? content : content.text || "Hiss...",
    },
  ]);
  return {
    text: typeof content === "string" ? content : content.text || "Hiss...",
    continue: true,
  };
}

async function handleThink(chatId, thinkingContent) {
  console.log("[handleThink] Storing reflection:", thinkingContent);
  await MessageService.storeAssistantMessage(chatId, [
    { type: "thinking", text: thinkingContent },
  ]);
  await updateMemory([
    {
      username: "BobTheSnake",
      role: "assistant_thinking",
      content: thinkingContent,
    },
  ]);
  return { continue: true };
}

async function handleImagineBackground(chatId, message, bot) {
  console.log(
    "[handleImagineBackground] Starting background image generation...",
  );

  // Send initial response
  await MessageService.storeAssistantMessage(chatId, [
    {
      type: "text",
      text: "🎨 I'm working on imagining that... Check back in a moment! 🐍",
    },
  ]);

  try {
    // Generate the image
    const { buffer, type } = await MediaService.generateMediaBuffer(message);

    // Handle social media posting and file saving in parallel
    const [filePath] = await Promise.all([
      MediaService.saveMediaLocally(buffer, type),
      XService.maybePostImage(buffer, message, type),
    ]);

    // Upload to S3
    const imageUrl = await MediaService.uploadMediaToS3(filePath);

    // Store success message
    await MessageService.storeAssistantMessage(chatId, [
      { type: "text", text: "Here's what I imagined! 🎨" },
      { type: "image", url: imageUrl },
    ]);

    return { text: "Image generated successfully!", continue: true };
  } catch (error) {
    console.error("[handleImagineBackground] Failed to generate image:", error);

    // Store error message
    await MessageService.storeAssistantMessage(chatId, [
      { type: "text", text: "Hiss... I couldn't imagine an image this time." },
    ]);

    return {
      text: "Failed to generate image",
      error: error.message,
      continue: false,
    };
  }
}
// ----------------------------------------------------
// endregion
// ----------------------------------------------------

// ----------------------------------------------------
// region: Exports
// ----------------------------------------------------
export { state, ACTIONS, backgroundTasks };
// ----------------------------------------------------
// endregion
// ----------------------------------------------------

async function handlePost(chatId, content, bot) {
  console.log("[handlePost] Posting tweet:", content);

  try {
    // Post to X with retry
    const tweetResult = await retry(() => XService.post({ text: content }), 2);

    if (!tweetResult?.id) {
      console.error("[handlePost] Failed to post tweet");
      return await handleSpeak(chatId, "Hiss... I couldn't post that tweet.");
    }

    // Generate tweet URL
    const tweetURL = `${process.env.X_BASE_URL || "https://x.com"}/bobthesnek/status/${tweetResult.id}`;

    // Store success message with tweet link
    await MessageService.storeAssistantMessage(chatId, [
      { type: "text", text: `🐦 Posted tweet! Check it out here: ${tweetURL}` },
    ]);

    return {
      text: `Tweet posted successfully! ${tweetURL}`,
      continue: true,
    };
  } catch (error) {
    console.error("[handlePost] Error posting tweet:", error);
    return await handleSpeak(
      chatId,
      "Hiss... Something went wrong while posting the tweet.",
    );
  }
}
