import OpenAI from "openai";
import { ChamberService } from "./chamberService.js";
import { updateMemory } from "../memory/memoryService.js";
import { SYSTEM_PROMPT, RESPONSE_INSTRUCTIONS } from "../../config/index.js";

// Action definitions
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

// State management
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

async function handleSpeak(roomName, content, chamberService) {
    console.log("[handleSpeak] Sending response:", content);
    await chamberService.sendMessage(roomName, {
        username: "BobTheSnake",
        content: content,
    });
    return { text: content, continue: true };
}

async function handleThink(roomName, thinkingContent, chamberService) {
    console.log("[handleThink] Storing reflection:", thinkingContent);
    await chamberService.sendMessage(roomName, {
        username: "BobTheSnake",
        content: `🤔 ${thinkingContent}`,
    });
    await updateMemory([
        {
            username: "BobTheSnake",
            role: "assistant_thinking",
            content: thinkingContent,
        },
    ]);
    return { continue: true };
}

async function handleWait(roomName, content, chamberService) {
    console.log("[handleWait] Sending wait response:", content);
    await chamberService.sendMessage(roomName, {
        username: "BobTheSnake",
        content: content,
    });
    return { continue: false };
}

function formatMessagesForContext(messages) {
    return messages.map((msg) => `${msg.username}: ${msg.content}`).join("\n");
}

async function handleMessage(roomName, messages, openai, chamberService) {
    try {
        const structuredPrompt = generateStructuredPrompt();
        const context = formatMessagesForContext(messages);

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
                chamberService,
            );
        }

        updateActionTimestamp(parsed.action);
        return await ACTIONS[parsed.action].handler(
            roomName,
            parsed.message,
            chamberService,
        );
    } catch (error) {
        console.error("[handleMessage] Error:", error);
        return await handleSpeak(
            roomName,
            "Hiss... Something went wrong. Let me slither back in a moment! 🐍",
            chamberService,
        );
    }
}

export async function initialize() {
    // Initialize ChamberService
    const chamberService = new ChamberService(
        process.env.ECHOCHAMBER_API_URL,
        process.env.ECHOCHAMBER_API_KEY,
    );

    // Verify connection
    await chamberService.verifyConnection();

    const openai = new OpenAI({
        baseURL: process.env.OPENAI_API_URL,
        apiKey: process.env.OPENAI_API_KEY,
    });

    // Create room if it doesn't exist
    await chamberService.createRoom({
        name: "serpent-pit",
        description: "Welcome to the serpent pit.",
        tags: ["serpent", "pit"],
    });

    // Subscribe to messages
    const unsubscribe = chamberService.subscribe(
        "serpent-pit",
        async (message) => {
            await handleMessage("general", [message], openai, chamberService);
        },
    );

    // Handle cleanup on process exit
    process.on("SIGINT", () => {
        unsubscribe();
        chamberService.cleanup();
        process.exit(0);
    });

    return {
        chamberService,
        cleanup: () => {
            unsubscribe();
            chamberService.cleanup();
        },
    };
}
