// gnonBot.js
import { GNONService } from "./services/gnon/gnonService.js";
import { updateMemory } from "./services/memory/memoryService.js";
import { SYSTEM_PROMPT, RESPONSE_INSTRUCTIONS } from "./config/index.js";

// Action definitions for GNON bot
const ACTIONS = {
    speak: {
        timeout: 3 * 10 * 1000, // 30 seconds
        description: "Say something relevant to the conversation",
        handler: handleSpeak,
    },
    think: {
        timeout: 15 * 60 * 1000, // 15 minutes
        description: "Reflect on the context and add a persistent thought",
        handler: handleThink,
    },
    wait: {
        timeout: 30 * 1000, // 30 seconds
        description: "Pause and wait for someone else to contribute",
        handler: handleWait,
    },
};

// In-memory state management
const state = {
    timers: {},
    lastActionTimes: {},
};

function isActionAllowed(actionName) {
    const now = Date.now();
    const lastUsed = state.lastActionTimes[actionName] || 0;
    const action = ACTIONS[actionName];

    if (!action) {
        console.warn(`[isActionAllowed] Unknown action: ${actionName}`);
        return false;
    }

    return now - lastUsed > action.timeout;
}

function updateActionTimestamp(actionName) {
    state.lastActionTimes[actionName] = Date.now();
}

// Modify the generateStructuredPrompt function
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

async function handleSpeak(roomName, content, gnonService) {
    console.log("[handleSpeak] Sending response:", content);
    await gnonService.sendMessage(roomName, content);
    return { text: content, continue: true };
}

async function handleThink(roomName, thinkingContent, gnonService) {
    console.log("[handleThink] Storing reflection:", thinkingContent);
    await gnonService.sendMessage(roomName, `🤔 ${thinkingContent}`);
    await updateMemory([
        {
            username: "BobTheSnake",
            role: "assistant_thinking",
            content: thinkingContent,
        },
    ]);
    return { continue: true };
}

async function handleWait(roomName, content, gnonService) {
    console.log("[handleWait] Sending wait response:", content);
    await gnonService.sendMessage(roomName, content);
    return { continue: false };
}

async function handleMessage(roomName, messages, openai, gnonService) {
    try {
        // Generate dynamic prompt based on available actions
        const structuredPrompt = generateStructuredPrompt();

        // Format recent messages for context
        const context = gnonService.formatMessagesForContext(messages);

        // Request structured output for decision-making
        const response = await openai.chat.completions.create({
            model: "nousresearch/hermes-3-llama-3.1-405b",
            messages: [
                { role: "system", content: structuredPrompt },
                { role: "user", content: context },
                { role: "user", content: RESPONSE_INSTRUCTIONS },
            ],
            response_format: { type: "json_object" },
            temperature: 0.8,
        });

        const parsed = JSON.parse(
            response.choices[0]?.message?.content || "{}",
        );

        if (!parsed.action || !ACTIONS[parsed.action]) {
            throw new Error("Invalid response format");
        }

        if (!isActionAllowed(parsed.action)) {
            return await handleSpeak(
                roomName,
                `Hiss... I need to wait a bit before I can ${parsed.action} again.`,
                gnonService,
            );
        }

        updateActionTimestamp(parsed.action);
        return await ACTIONS[parsed.action].handler(
            roomName,
            parsed.message,
            gnonService,
        );
    } catch (error) {
        console.error("[handleMessage] Error:", error);
        return await handleSpeak(
            roomName,
            "Hiss... Something went wrong. Let me slither back in a moment! 🐍",
            gnonService,
        );
    }
}

export async function initialize() {
    const gnonService = new GNONService({
        ECHO_CHAMBERS_URL: process.env.ECHO_CHAMBERS_URL,
        ECHO_CHAMBERS_API_KEY: process.env.ECHO_CHAMBERS_API_KEY,
        AGENT_USERNAME: "BobTheSnake",
        AGENT_MODEL: "gpt-4",
        MIN_MESSAGE_DELAY: 30000,
        MAX_MESSAGES_PER_HOUR: 120,
    });

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    // Join initial room
    const cleanup = await gnonService.joinRoom("general", async (messages) => {
        if (messages.length > 0) {
            await handleMessage("general", messages, openai, gnonService);
        }
    });

    // Handle cleanup on process exit
    process.on("SIGINT", () => {
        cleanup();
        process.exit(0);
    });

    return {
        gnonService,
        cleanup,
    };
}
