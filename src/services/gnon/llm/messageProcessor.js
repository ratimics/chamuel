    import { ACTIONS } from '../actions/handlers.js';
    import { loadMemory } from '../../memory/memoryService.js';

    const LLM_MODEL = "nousresearch/hermes-3-llama-3.1-405b";

    export function formatMessagesForContext(messages) {
        return messages
            .map((msg) => `${msg?.sender?.username || msg.username}: ${msg.content}`)
            .join("\n");
    }

    export function generateStructuredPrompt(style, lastActionTimes) {
        const availableActions = Object.entries(ACTIONS)
            .filter(([name]) => isActionAllowed(name, lastActionTimes))
            .map(([name, config]) => `- ${name}: ${config.description}`);

        return `Currently available actions:
    ${availableActions.join("\n")}
    // ...rest of prompt format...`;
    }

    export async function processLLMResponse(openai, context, systemPrompt, responseInstructions = null, requireJson = true) {
        try {
            const memory = await loadMemory();
            const messages = [
                { role: "system", content: systemPrompt },
                { role: "assistant", content: `My recent memories: ${memory || ''}` },
                { role: "user", content: context },
            ];

            // Add response instructions if provided
            if (responseInstructions) {
                messages.push({ role: "user", content: responseInstructions });
            }

            const config = {
                model: LLM_MODEL,
                messages: messages,
                temperature: 0.8,
            };

            // Add JSON format requirement if needed
            if (requireJson) {
                // Ensure that the API supports 'response_format'
                // If not, consider including instructions within the system/user messages
                config.response_format = { type: "json_object" };
            }

            const response = await openai.chat.completions.create(config);

            // Validate the response structure
            if (!response || !response.choices || !response.choices.length) {
                throw new Error("Invalid response structure from LLM.");
            }

            const content = response.choices[0].message.content;

            return requireJson ? parseJSONWithExtraction(content) : { message: content };
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
        try {
            // First try direct JSON parse after cleaning
            const cleaned = rawString.replace(/^\s*[\r\n]+|[\r\n]+\s*$/g, '');
            return JSON.parse(cleaned);
        } catch (e) {
            // Look for JSON object boundaries
            const startIdx = rawString.indexOf("{");
            const endIdx = rawString.lastIndexOf("}");

            if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
                // Default to speak action if no valid JSON found
                return {
                    action: "speak",
                    message: rawString.trim()
                };
            }

            // Extract and parse the JSON portion with extra cleaning
            const extracted = rawString.slice(startIdx, endIdx + 1);
            const cleanedExtracted = extracted.replace(/[\u0000-\u001F]+/g, '').trim();
            try {
                return JSON.parse(cleanedExtracted);
            } catch (err) {
                // Fallback to speak action if JSON parsing fails
                return {
                    action: "speak",
                    message: rawString.trim()
                };
            }
        }
    }
