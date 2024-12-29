// ----------------------------------------------------
// region: Imports & Constants
// ----------------------------------------------------
import { updateMemory } from "../memory/memoryService.js";

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
    timeout: 30_000, // 30 seconds
    description: "Say something relevant to the conversation",
    handler: handleSpeak,
  },
  think: {
    timeout: 5 * 60_000, // 5 minutes
    description: "Reflect on the context and add a persistent thought",
    handler: handleThink,
  },
  imagine: {
    timeout: 10 * 60_000, // 10 minutes
    description: "Create a fun image or meme inspired by the discussion",
    handler: () =>
      console.warn("[handleImagine] Action is deprecated. Doing nothing."),
  },
  wait: {
    timeout: 30_000, // 30 seconds
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
    // 1. Retrieve chat history
    const history = await MessageService.fetchChatHistory(chatId, 20);
    if (!history.length) return null; // do nothing if no history

    // 1A. Check if the most recent message is from BobTheSnake
    const lastMsg = history[history.length - 1];
    if (lastMsg.sender === "BobTheSnake") {
      console.log(
        "[handleText] Last message is from BobTheSnake; skipping self-reply."
      );
      return null;
    }

    // 2. Combine messages
    const combinedMessages = MessageService.combineMessages(history);

    // 3. Build dynamic prompt
    const structuredPrompt = generateStructuredPrompt();
    const responseInstructions = RESPONSE_INSTRUCTIONS;

    // 4. Attempt to parse an action & message from the LLM
    const maxRetries = 5;
    let action, message;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { action: act, message: msg } = await getValidResponse(
          openai,
          structuredPrompt,
          combinedMessages,
          responseInstructions
        );
        if (!ACTIONS[act]) {
          throw new Error(`Invalid or unknown action: '${act}'`);
        }
        action = act;
        message = msg;
        break;
      } catch (error) {
        console.error(
          `[handleText] Attempt #${attempt} parse error:`,
          error.message
        );
        if (attempt === maxRetries) {
          console.error("[handleText] All parse attempts failed, doing nothing.");
          return null; // NO fallback to the chat
        }
        // small delay
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // 5. Cooldown check
    if (!isActionAllowed(action)) {
      console.log(`[handleText] Action "${action}" is on cooldown. Doing nothing.`);
      return null; // NO fallback to the chat
    }
    updateActionTimestamp(action);

    // 6. If action is "imagine", do nothing
    if (action === "imagine") {
      console.warn("[handleText] 'imagine' is deprecated; ignoring.");
      return null;
    }

    // 7. Execute the chosen action
    return await ACTIONS[action].handler(chatId, message, bot);
  } catch (error) {
    console.error("[handleText] Unexpected error:", error);
    // Do not send anything to the chat
    return null;
  }
}

// We'll place this "valid response" retrieval logic in its own function for clarity.
async function getValidResponse(openai, prompt, combinedMessages, instructions) {
  const response = await openai.chat.completions.create({
    model: "nousresearch/hermes-3-llama-3.1-405b",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: combinedMessages + "\n\n" + instructions },
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
            description: "Content or reasoning behind the chosen action.",
          },
        },
        required: ["action", "message"],
        additionalProperties: false,
      },
    },
    temperature: 0.8,
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  if (!parsed.action || !parsed.message) {
    throw new Error("Missing 'action' or 'message' in LLM response");
  }
  return { action: parsed.action, message: parsed.message };
}
// ----------------------------------------------------
// endregion
// ----------------------------------------------------

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
  console.log("[handleSpeak]", content);
  await MessageService.storeAssistantMessage(chatId, [
    { type: "text", text: content },
  ]);
  return { text: content, continue: true };
}

async function handleThink(chatId, thinkingContent) {
  console.log("[handleThink]", thinkingContent);
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