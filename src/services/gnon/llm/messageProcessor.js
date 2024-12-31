import { ACTIONS } from '../actions/handlers.js';

import { loadMemory } from '../../memory/memoryService.js';

const MAX_PARSE_RETRIES = 2;
const LLM_MODEL = "nousresearch/hermes-3-llama-3.1-405b";

export function formatMessagesForContext(messages) {
    return messages.map((msg) => `${msg?.sender?.username || msg.username}: ${msg.content}`).join("\n");
}

export function generateStructuredPrompt(style, lastActionTimes) {
    const availableActions = Object.entries(ACTIONS)
        .filter(([name]) => isActionAllowed(name, lastActionTimes))
        .map(([name, config]) => `- ${name}: ${config.description}`);

    return `Currently available actions:
    ${availableActions.join("\n")}
    // ...rest of prompt format...`;
}

export async function processLLMResponse(openai, context, systemPrompt, responseInstructions, requireJson = true) {
    try {
        const memory = await loadMemory();
        const config = {
            model: LLM_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "assistant", content: `My recent memories: ${memory || ''}` },
                { role: "user", content: context },
            ],
            temperature: 0.8,
        };

        // Add JSON format requirement and response instructions if needed
        if (requireJson) {
            config.response_format = { type: "json_object" };
        }
        if (responseInstructions) {   
            config.messages.push({ role: "user", content: responseInstructions });
        }

        const response = await openai.chat.completions.create(config);
        const content = response.choices[0].message.content;

        return requireJson ? parseJSONWithExtraction(content) :  { message: content };
    } catch (error) {
        console.error("[processLLMResponse] Error:", error);
        throw error;
    }
}

function isActionAllowed(actionName, lastActionTimes) {
    const now = Date.now();
    const lastUsed = lastActionTimes[actionName] || 0;
    const action = ACTIONS[actionName];

    if (!action) return false;
    return now - lastUsed > action.timeout;
}

function parseJSONWithExtraction(rawString) {
    const startIdx = rawString.indexOf("{");
    const endIdx = rawString.lastIndexOf("}");

    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
        throw new Error("No valid JSON object found in the string.");
    }

    return JSON.parse(rawString.slice(startIdx, endIdx + 1).trim());
}
