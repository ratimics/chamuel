// ----------------------------------------------------
// region: Imports & Constants
// ----------------------------------------------------
import { randomUUID } from 'crypto';
import { updateMemory } from '../memory/memoryService.js';

import {
    MessageService,
    DecisionService,
    MediaService,
    ResponseService,
    XService,
    NFTService
} from './index.js';

// Action definitions with configurable timeouts and handlers
const ACTIONS = {
    speak: {
        timeout: 3 * 10 * 1000, // 30 seconds
        description: "Say something relevant to the conversation",
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
        handler: handleImagine,
    },
    wait: {
        timeout: 30 * 1000, // 30 seconds
        description: "Pause and wait for someone else to contribute",
        handler: async () => ({ continue: false }),
    }
};

// In-memory state management
const state = {
    timers: {},
    lastActionTimes: {}
};
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
    You are Bob the Snake, a quirky and clever assistant interacting in a chat. 
    Your goal is to determine the most appropriate action based on the context of the conversation.

    Currently available actions:
    ${availableActions.join('\n')}

    Choose what you want to do, and provide the relevant message. 
    Only choose from the currently available actions listed above.

    Always pick the action that fits best with the given context. Respond in a structured JSON format adhering strictly to the schema.
    `;
}
// ----------------------------------------------------
// endregion
// ----------------------------------------------------


// ----------------------------------------------------
// region: Main Orchestrator with Structured Outputs
// ----------------------------------------------------
export async function handleText(chatId, openai, bot) {
    console.log(`[handleText] Orchestrator invoked for chatId: ${chatId}`);

    try {
        // 1. Retrieve chat history
        console.log('[handleText] Step 1: Retrieving chat history...');
        const history = await MessageService.fetchChatHistory(chatId, 20);
        console.log(`[handleText] Step 1: Retrieved ${history.length} messages.`);

        if (!history.length) {
            console.log('[handleText] Step 1: No history found, returning null.');
            return null;
        }

        // 2. Combine messages into a single string
        console.log('[handleText] Step 2: Combining messages...');
        const combinedMessages = MessageService.combineMessages(history);

        // 3. Generate dynamic prompt based on available actions
        const structuredPrompt = generateStructuredPrompt();

        // 4. Request Structured Output for decision-making
        console.log('[handleText] Step 3: Requesting structured output from LLM...');
        const getValidResponse = async () => {
            const response = await openai.chat.completions.create({
                model: "nousresearch/hermes-3-llama-3.1-405b",
                messages: [
                    { role: "system", content: structuredPrompt },
                    { role: "user", content: combinedMessages }
                ],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        type: "object",
                        properties: {
                            action: {
                                type: "string",
                                enum: Object.keys(ACTIONS)
                            },
                            message: {
                                type: "string",
                                description: "The content or reasoning behind the chosen action."
                            }
                        },
                        required: ["action", "message"],
                        additionalProperties: false
                    }
                },
                temperature: 0.8
            });

            const parsed = JSON.parse(response.choices[0]?.message?.content) || {};

            return {
                action: parsed.action,
                message: parsed.message
            }
        }


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
                // Break early if we have what we need
                break;
            } catch (error) {
                console.error(`Attempt #${attempt} failed: ${error.message}`);

                // Optional: add a small delay before next retry
                await new Promise(resolve => setTimeout(resolve, 1000));

                if (attempt === maxRetries) {
                    console.error("All attempts failed.");
                }
            }
        }

        if (!action || !message) {
            console.error('[handleText] Invalid response. Falling back to default response.');
            return await fallbackResponse(chatId, bot);
        }


        console.log(`[handleText] Step 3: LLM chose action: ${action}`);
        console.log(`[handleText] Step 3: LLM message: ${message}`);

        if (!action || !ACTIONS[action]) {
            console.error('[handleText] Invalid response. Falling back to default response.');
            return await fallbackResponse(chatId, bot);
        }

        // 5. Execute the chosen action if allowed
        if (!isActionAllowed(action)) {
            console.log(`[handleText] Action "${action}" is on cooldown.`);
            return await handleSpeak(chatId, bot, `Hiss... I need to wait a bit before I can ${action} again.`);
        }

        // 6. Update action timestamp and execute handler
        updateActionTimestamp(action);
        return await ACTIONS[action].handler(chatId, message, bot);

    } catch (error) {
        console.error('[handleText] Caught an error:', error);
        return await fallbackResponse(chatId, bot, error.message);
    }
}
// ----------------------------------------------------
// endregion
// ----------------------------------------------------


// ----------------------------------------------------
// region: Action Handlers
// ----------------------------------------------------
async function fallbackResponse(chatId, bot, errorMessage = null) {
    const fallbackMessage = "Hiss... Something went wrong. Let's just wait for next time 🐍";
    console.error(`[fallbackResponse] ${errorMessage || "No error message provided."}`);
    return { text: fallbackMessage, continue: false };
}

async function handleSpeak(chatId, content) {
    console.log('[handleSpeak] Sending response:', content);
    await MessageService.storeAssistantMessage(chatId, [{ type: 'text', text: content }]);
    return { text: content, continue: true };
}

async function handleThink(chatId, thinkingContent) {
    console.log('[handleThink] Storing reflection:', thinkingContent);
    await MessageService.storeAssistantMessage(chatId, [{ type: 'thinking', text: thinkingContent }]);
    await updateMemory([
        { username: 'BobTheSnake', role: 'assistant_thinking', content: thinkingContent }
    ]);
    return { text: `[[🧠 Memory generated]]`, continue: true };
}


  
async function handleImagine(chatId, message) {
    console.log('[handleImagine] Generating an image...');
    try {
        const { buffer, type } = await MediaService.generateMediaBuffer(message);
        await XService.maybePostImage(
            buffer, message, type
        )
        const filePath = await MediaService.saveMediaLocally(buffer, type);
        const imageUrl = await MediaService.uploadMediaToS3(filePath);
        return { text: "🖼️ Meme Generated: " + message, imageUrl, filePath, continue: true };
    } catch (error) {
        console.error('[handleImagine] Failed to generate image:', error);
        return { text: "Hiss... I couldn't imagine an image this time.", continue: false };
    }
}
// ----------------------------------------------------
// endregion
// ----------------------------------------------------


// ----------------------------------------------------
// region: Export state and actions
// ----------------------------------------------------
export { state, ACTIONS };
// ----------------------------------------------------
// endregion
// ----------------------------------------------------