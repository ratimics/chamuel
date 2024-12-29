import OpenAI from "openai";
import { ChamberService } from "./chamberService.js";
import { processLLMResponse, formatMessagesForContext } from "./llm/messageProcessor.js";
import { ACTIONS } from "./actions/handlers.js";
import { SYSTEM_PROMPT, RESPONSE_INSTRUCTIONS } from "../../config/index.js";

/* --------------------- CONFIG & CONSTANTS --------------------- */

/** Bob's home channel name */
const HOME_CHANNEL = "serpent-pit";

/** LLM model used to generate responses */
const LLM_MODEL = "nousresearch/hermes-3-llama-3.1-405b";

/** Decaying interest parameters for "general" channel */
const GENERAL_DECAY_INTERVAL = 60 * 60 * 1000; // 1 hour
const INITIAL_INTEREST_LEVEL = 10; // How "interested" Bob is initially in 'general'
const MIN_INTEREST_TO_RESPOND = 3; // Minimum interest level required for Bob to respond in 'general'
const INTEREST_DECAY_AMOUNT = 1; // How much interest decays each time Bob responds or enough time passes

/* --------------------- IN-MEMORY STATE --------------------- */

const state = {
  /**
   * Tracks Bob's interest in 'general' over time.
   * Starts at INITIAL_INTEREST_LEVEL, and decays with each response or over time.
   */
  generalInterestLevel: INITIAL_INTEREST_LEVEL,

  /**
   * Timestamps for Bob's last actions per channel, if you need cooldown logic, etc.
   */
  lastActionTimes: {},

  /**
   * Tracks the last time we applied time-based decay to Bob's interest in 'general'.
   */
  lastDecayTime: Date.now(),
};

/* --------------------- CORE BOT LOGIC --------------------- */

/**
 * Checks if Bob is mentioned in any of the provided messages.
 * Adjust your mention logic here if needed (e.g., partial matches, regex, etc.).
 */
function isBobMentioned(messages) {
  return messages.some((m) => {
    const content = (m?.content || "").toLowerCase();
    return content.includes("bob") || content.includes("snake");
  });
}

/**
 * Handle a batch of new messages for a specific channel.
 * 1) Bob always responds in the home channel.
 * 2) Otherwise, respond only if:
 *    - It's 'general' and Bob's interest is high enough.
 *    - Or Bob is mentioned in these new messages.
 */
async function handleChannelMessages(channelName, messages, openai, chamberService) {
  try {
    // Filter out Bob's own messages (avoid responding to ourselves).
    const othersMessages = messages.filter(
      (m) => m.sender?.username !== "BobTheSnake"
    );
    if (othersMessages.length === 0) return;

    // Home channel: always respond.
    if (channelName === HOME_CHANNEL) {
      return await respondToMessages(channelName, othersMessages, openai, chamberService);
    }

    // For other channels:
    if (channelName.toLowerCase() === "general") {
      maybeDecayGeneralInterest();
      // Respond only if Bob still cares enough about 'general'
      if (state.generalInterestLevel >= MIN_INTEREST_TO_RESPOND) {
        // For example, Bob responds if there's at least 2 new messages or Bob is mentioned
        if (othersMessages.length >= 2 || isBobMentioned(othersMessages)) {
          await respondToMessages(channelName, othersMessages, openai, chamberService);

          // After responding, decrement interest
          state.generalInterestLevel = Math.max(0, state.generalInterestLevel - INTEREST_DECAY_AMOUNT);
        }
      }
    } else {
      // Other channels: respond only if Bob is mentioned
      if (isBobMentioned(othersMessages)) {
        await respondToMessages(channelName, othersMessages, openai, chamberService);
      }
    }
  } catch (error) {
    console.error("[handleChannelMessages] Error in channel:", channelName, error);
    // Send a generic fallback response rather than exposing error details
    await ACTIONS.speak.handler(
      channelName,
      "Hiss... Something went wrong. Let me slither back in a moment! 🐍",
      chamberService
    );
  }
}

/**
 * Builds a textual context from the new messages and generates a response via the LLM.
 * Then executes the resulting action (e.g., speak/think/wait).
 */
async function respondToMessages(channelName, messages, openai, chamberService) {
  // Build a context from the new messages
  const context = formatMessagesForContext(messages);

  // Optionally, you could also incorporate channel context or entity context
  // if your system provides them, e.g.:
  //   const channelContext = messages[0].channelContext || {};
  //   const entityContext = messages[0].entityProfile || {};

  const enhancedContext = `
  Channel: ${channelName}

  Recent Messages:
  ${context}
  `;

  // Get a structured JSON response from the LLM
  const parsed = await processLLMResponse(
    openai,
    enhancedContext,
    SYSTEM_PROMPT,
    RESPONSE_INSTRUCTIONS
  );

  // Validate the LLM's action to avoid unexpected behavior
  if (!parsed || typeof parsed !== "object") {
    console.warn("[respondToMessages] LLM returned malformed JSON:", parsed);
    return;
  }
  if (!parsed.action || !ACTIONS[parsed.action]) {
    console.warn("[respondToMessages] Unknown or missing action in LLM response:", parsed.action);
    return;
  }

  // Execute the chosen action
  await ACTIONS[parsed.action].handler(channelName, parsed.message, chamberService);
}

/**
 * Decreases Bob's interest in 'general' if enough time has passed since last check.
 * This ensures that Bob's interest does not remain static if he's not responding frequently.
 */
function maybeDecayGeneralInterest() {
  const now = Date.now();
  if (now - state.lastDecayTime >= GENERAL_DECAY_INTERVAL) {
    // Apply time-based decay
    state.generalInterestLevel = Math.max(
      0,
      state.generalInterestLevel - INTEREST_DECAY_AMOUNT
    );
    state.lastDecayTime = now;
    console.log(
      `[maybeDecayGeneralInterest] Bob's new generalInterestLevel: ${state.generalInterestLevel}`
    );
  }
}

/* --------------------- OPTIONAL: CHOOSE A STARTUP CHANNEL ---------------------
   If you want Bob to *immediately* post something in a certain channel
   (besides the home channel) at startup, you can implement that logic here.
   For example, to post a random greeting in a random channel:
*/

async function postStartupGreeting(openai, chamberService, channelName) {
  try {
    const greetingPrompt = `You are Bob the Snake. Generate a short greeting for the channel "${channelName}", 
    indicating you're here to observe or chat. Keep it snake-themed and friendly.`;

    const parsed = await processLLMResponse(
      openai,
      greetingPrompt,
      SYSTEM_PROMPT,
      RESPONSE_INSTRUCTIONS
    );

    if (parsed?.action && ACTIONS[parsed.action]) {
      await ACTIONS[parsed.action].handler(channelName, parsed.message, chamberService);
    } else {
      // Fallback if no valid action
      await ACTIONS.speak.handler(channelName, "Sssalutations, friendssss! 🐍", chamberService);
    }
  } catch (err) {
    console.error("[postStartupGreeting] Error sending greeting to channel:", channelName, err);
  }
}

/* --------------------- BOT INITIALIZATION --------------------- */

export async function initialize() {
  try {
    console.log("[initialize] Starting bot initialization...");

    // 1) Create ChamberService & verify connection
    const chamberService = new ChamberService(
      process.env.ECHOCHAMBER_API_URL,
      process.env.ECHOCHAMBER_API_KEY
    );
    console.log("[initialize] Verifying connection to the server...");
    await chamberService.verifyConnection();

    // 2) Create OpenAI client
    const openai = new OpenAI({
      baseURL: process.env.OPENAI_API_URL,
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 3) Ensure home channel exists
    try {
      await chamberService.createRoom({
        name: HOME_CHANNEL,
        description: "Welcome to the serpent pit.",
        tags: ["serpent", "pit"],
      });
    } catch (error) {
      console.warn(`[initialize] Could not create/find home channel '${HOME_CHANNEL}':`, error);
    }

    // 4) List all channels from the server
    const channels = await chamberService.listChannels();
    if (!channels || channels.length === 0) {
      console.warn("[initialize] No channels found on the server. Bob will have nothing to do.");
    } else {
      // 5) Subscribe to each channel (including "general" if it exists)
      channels.forEach((ch) => {
        try {
          chamberService.subscribe(ch.name, async (messages) => {
            await handleChannelMessages(ch.name, messages, openai, chamberService);
          });
          console.log(`[initialize] Subscribed to channel: ${ch.name}`);
        } catch (subscribeErr) {
          console.error(`[initialize] Failed to subscribe to channel '${ch.name}':`, subscribeErr);
        }
      });

      // OPTIONAL: Post a startup greeting in a random channel (besides home)
      // or specifically in "general" if you want immediate presence there:
      const otherChannels = channels.filter((c) => c.name.toLowerCase() !== HOME_CHANNEL);
      const generalChannel = otherChannels.find((c) => c.name.toLowerCase() === "general");

      if (generalChannel) {
        console.log("[initialize] Found 'general' channel. Posting a startup greeting...");
        await postStartupGreeting(openai, chamberService, generalChannel.name);
      } else if (otherChannels.length > 0) {
        // As an example, pick the first or random channel
        const randomChannel = otherChannels[Math.floor(Math.random() * otherChannels.length)];
        console.log(`[initialize] Posting a startup greeting in "${randomChannel.name}"...`);
        await postStartupGreeting(openai, chamberService, randomChannel.name);
      }
    }

    console.log("[initialize] Bot is now initialized and listening in all channels.");

    // Graceful shutdown
    const cleanup = () => {
      console.log("[cleanup] Cleaning up resources...");
      chamberService.cleanup();
    };
    process.on("SIGINT", cleanup);

    return { chamberService, cleanup };
  } catch (error) {
    console.error("[initialize] Fatal error during bot initialization:", error);
    process.exit(1);
  }
}