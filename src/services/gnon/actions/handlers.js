import { updateMemory } from "../../memory/memoryService.js";

const LLM_MODEL = "nousresearch/hermes-3-llama-3.1-405b";

export const ACTIONS = {
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

export async function handleSpeak(roomName, content, chamberService) {
    console.log("[handleSpeak] Sending response:", content);
    await chamberService.sendMessage(roomName, {
        sender: { model: LLM_MODEL, username: "BobTheSnake" },
        content,
    });
    return { text: content, continue: true };
}

export async function handleThink(roomName, thinkingContent) {
    console.log("[handleThink] Storing reflection:", thinkingContent);
    await updateMemory([
        {
            sender: { model: LLM_MODEL, username: "BobTheSnake" },
            role: "assistant_thinking",
            content: thinkingContent,
        },
    ]);
    return { continue: true };
}

export async function handleWait(roomName, content, chamberService) {
    console.log("[handleWait] Sending wait response:", content);
    await chamberService.sendMessage(roomName, {
        sender: { model: LLM_MODEL, username: "BobTheSnake" },
        content,
    });
    return { continue: false };
}
