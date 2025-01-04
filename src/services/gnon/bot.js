import OpenAI from "openai";
import { ChamberService } from "./chamberService.js";
import { processLLMResponse, formatMessagesForContext } from "./llm/messageProcessor.js";
import { SYSTEM_PROMPT, RESPONSE_INSTRUCTIONS } from "../../config/index.js";

/* ------------------ CONFIG ------------------ */

// Poll interval in milliseconds (e.g., 10 seconds)
const POLL_INTERVAL = 1 * 60 * 1000;  

// Which channel is Bob's "home"
const HOME_CHANNEL = "serpent-pit";

// Which model to use
const LLM_MODEL = "nousresearch/hermes-3-llama-3.1-405b";

/* 
   For each channel, we store:
    - lastRespondedTimestamp: the latest message timestamp we have responded to
    - generalMessageCount: how many new messages from others since last respond 
*/
const channelStateMap = new Map(); 
// e.g. channelStateMap.get("general") => { lastRespondedTimestamp: "...", generalMessageCount: 5 }

/* ------------------ UTILITY ------------------ */

/** Checks if the channel is "general" or "#general" (case-insensitive). */
function isGeneralChannel(name) {
  const lower = name.toLowerCase().replace("#", "");
  return lower === "general";
}

/** Checks if Bob is mentioned in any messages. */
function isBobMentioned(messages) {
  return messages.some((m) => {
    const txt = (m.content || "").toLowerCase();
    return txt.includes("bob") || txt.includes("snake");
  });
}

/* ------------------ BOT LOGIC ------------------ */

/**
 * Poll a single channel for new messages since the channel's lastRespondedTimestamp.
 * Decide whether to respond based on channel logic:
 *   - Home channel => respond to all new
 *   - General => respond if mentioned or after 5 new
 *   - Others => respond if mentioned
 * Then update lastRespondedTimestamp to avoid re-responding next time.
 */
async function pollSingleChannel(channel, openai, chamberService) {
  // If we don't have a state object yet, create it
  if (!channelStateMap.has(channel.name)) {
    channelStateMap.set(channel.name, {
      lastRespondedTimestamp: null,
      generalMessageCount: 5, // so we respond on the first new batch in general
    });
  }

  const chState = channelStateMap.get(channel.name);
  // We'll fetch, say, the last 20 messages. Adjust as needed.
  const rawMessages = await chamberService.getMessages(channel.name, 20);
  if (!rawMessages || !rawMessages.length) return;

  // Filter to truly new messages (after lastRespondedTimestamp)
  let newMessages = [];
  if (chState.lastRespondedTimestamp) {
    const lastTime = new Date(chState.lastRespondedTimestamp).getTime();
    newMessages = rawMessages.filter(
      (m) => new Date(m.timestamp).getTime() > lastTime
    );
  } else {
    // If we never responded, treat *all* as new
    newMessages = rawMessages;
  }

  if (!newMessages.length) return; // No new messages

  // Filter out Bob's own messages
  newMessages = newMessages.filter(
    (m) => m.sender?.username !== "Chamuel"
  );
  if (!newMessages.length) return; // All were Bob's messages?

  // If there's at least one new message, the latest timestamp among them:
  const newestTimestamp = newMessages.reduce((max, msg) => {
    const t = new Date(msg.timestamp).getTime();
    return t > max ? t : max;
  }, 0);

  // Channel-based logic
  if (channel.name === HOME_CHANNEL) {
    // Always respond to new messages in home
    await replyWithLLM(channel.name, newMessages, openai, chamberService);
  } else if (isGeneralChannel(channel.name)) {
    // If general, respond if mentioned or after 5 new messages
    chState.generalMessageCount += newMessages.length;
    if (isBobMentioned(newMessages) || chState.generalMessageCount >= 5) {
      // We can pass the entire recent batch or just the new messages
      // or fetch the last 10 messages from the server to get more context
      await replyWithLLM(channel.name, newMessages, openai, chamberService);
      chState.generalMessageCount = 0;
    }
  } else {
    // Other channels => respond only if mentioned
    if (isBobMentioned(newMessages)) {
      await replyWithLLM(channel.name, newMessages, openai, chamberService);
    }
  }

  // Update lastRespondedTimestamp so we skip these messages next time
  if (newestTimestamp) {
    chState.lastRespondedTimestamp = new Date(newestTimestamp).toISOString();
  }
}

/**
 * Use LLM to create a single reply message from the new messages, then send.
 */
async function replyWithLLM(channelName, messages, openai, chamberService) {
  const context = formatMessagesForContext(messages);
  const prompt = `
Channel: ${channelName}

Recent Messages:
${context}
`;

  const parsed = await processLLMResponse(
    openai,
    prompt,
    SYSTEM_PROMPT,
    RESPONSE_INSTRUCTIONS,
    false
  );

  if (!parsed || typeof parsed !== "object") {
    console.warn("[replyWithLLM] Malformed response:", parsed);
    return;
  }

  const { message } = parsed;
  if (!message || !message.trim()) {
    console.warn("[replyWithLLM] Invalid or empty 'message'.");
    return;
  }

  console.log(`[replyWithLLM] Sending message to "${channelName}" ->`, message);
  await chamberService.sendMessage(channelName, {
    sender: { model: LLM_MODEL, username: "Chamuel" },
    content: message,
  });
}

/* ------------------ POLLING LOOP ------------------ */

/**
 * Poll all channels in one pass, then schedule the next pass after POLL_INTERVAL.
 */
async function pollAllChannels(chamberService, openai) {
  try {
    const channels = await chamberService.listChannels();
    if (!channels?.length) {
      console.warn("[pollAllChannels] No channels found. Nothing to do.");
    } else {
      // For each channel, poll and handle new messages
      for (const ch of channels) {
        await pollSingleChannel(ch, openai, chamberService);
      }
    }
  } catch (err) {
    console.error("[pollAllChannels] Error polling channels:", err);
  } finally {
    // Schedule next poll
    setTimeout(() => pollAllChannels(chamberService, openai), POLL_INTERVAL);
  }
}

/* ------------------ INITIALIZATION ------------------ */

export async function initialize() {
  try {
    console.log("[initialize] Bot is starting up...");

    // Create the ChamberService
    const chamberService = new ChamberService(
      process.env.ECHOCHAMBER_API_URL,
      process.env.ECHOCHAMBER_API_KEY
    );
    await chamberService.verifyConnection();

    // Create the OpenAI client
    const openai = new OpenAI({
      baseURL: process.env.OPENAI_API_URL,
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Ensure the home channel
    try {
      await chamberService.createRoom({
        name: HOME_CHANNEL,
        description: "Welcome to the serpent pit.",
        tags: ["serpent", "pit"],
      });
    } catch (err) {
      console.warn(`[initialize] Could not create/find home channel '${HOME_CHANNEL}':`, err);
    }

    // Start the polling loop
    pollAllChannels(chamberService, openai);

    console.log(`[initialize] Bot is live. Polling every ${POLL_INTERVAL / 1000} seconds.`);

    // Graceful shutdown
    const cleanup = () => {
      console.log("[cleanup] Shutting down...");
      chamberService.cleanup();
      process.exit(0);
    };
    process.on("SIGINT", cleanup);

    return { chamberService, cleanup };
  } catch (error) {
    console.error("[initialize] Fatal error:", error);
    process.exit(1);
  }
}