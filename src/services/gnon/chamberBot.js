import OpenAI from "openai";
import { ChamberService } from "./chamberService.js";
import { ChannelAnalyzer } from '../analysis/channelAnalyzer.js';
import { ChannelManager } from './channels/channelManager.js';
import { ACTIONS } from './actions/handlers.js';
import { processLLMResponse, formatMessagesForContext, generateStructuredPrompt } from './llm/messageProcessor.js';
import { SYSTEM_PROMPT, RESPONSE_INSTRUCTIONS } from "../../config/index.js";

const CHANNEL_CHECK_INTERVAL = 5 * 60 * 1000;
const LLM_MODEL = "nousresearch/hermes-3-llama-3.1-405b";
const state = { lastActionTimes: {} };

async function handleMessage(roomName, messages, openai, chamberService) {
    try {
        const context = formatMessagesForContext(messages);
        const enhancedContext = `
Channel Context:
${JSON.stringify(messages[0].channelContext, null, 2)}

Entity Context:
${JSON.stringify(messages[0].entityProfile, null, 2)}

Recent Messages:
${context}
`;

        const parsed = await processLLMResponse(
            openai, 
            enhancedContext, 
            SYSTEM_PROMPT,
            generateStructuredPrompt(RESPONSE_INSTRUCTIONS, state.lastActionTimes)
        );

        if (!ACTIONS[parsed.action]) return;
        
        state.lastActionTimes[parsed.action] = Date.now();
        return ACTIONS[parsed.action].handler(roomName, parsed.message, chamberService);
    } catch (error) {
        console.error("[handleMessage] Error:", error);
        return ACTIONS.speak.handler(
            roomName,
            "Hiss... Something went wrong. Let me slither back in a moment! 🐍",
            chamberService
        );
    }
}

async function generateStartupMessage(openai, channel, channelHistory = null) {
    try {
        let prompt;
        if (channel === "serpent-pit") {
            prompt = `You are Bob the Snake, coming online in your home channel 'serpent-pit'. 
Generate a friendly startup message announcing your presence and intention to explore all the channels.
Keep it snake-themed and friendly!`;
        } else if (channel === "general") {
            prompt = `You are Bob the Snake joining the general channel.
Generate a friendly greeting that welcomes everyone and mentions you're here to chat and help.
Keep it professional but with snake-themed humor.`;
        } else {
            const contextPrompt = channelHistory ? 
                `\n\nRecent channel history:\n${channelHistory}` : 
                "\n\nThis appears to be my first visit to this channel.";
            
            prompt = `You are Bob the Snake, joining the channel '${channel}'.
Generate a friendly greeting that's relevant to this specific channel.
Consider the channel name and any context provided.${contextPrompt}
Keep it snake-themed and friendly!`;
        }

        return await processLLMResponse(
            openai,
            prompt,
            SYSTEM_PROMPT,
            null,
            false
        );
    } catch (error) {
        console.error("[generateStartupMessage] Error:", error);
        return "🐍 *slithers in quietly* Having some technical issues, but I'm here!";
    }
}

async function exploreChannels(channelManager, openai, chamberService) {
    try {
        const channelName = await channelManager.getUnvisitedChannel();
        if (!channelName) {
            console.warn("[explore] No channel available, retrying in 5 minutes");
            setTimeout(() => exploreChannels(channelManager, openai, chamberService), 5 * 60 * 1000);
            return;
        }
        
        let channelContext = {};
        let entityProfiles = [];
        
        try {
            channelContext = await channelManager.analyzer.getChannelContext(channelName);
            entityProfiles = await channelManager.analyzer.getRecentEntityProfiles(channelName);
        } catch (dbError) {
            console.warn("[explore] Database access error:", dbError.message);
        }

        const message = await generateStartupMessage(
            openai, 
            channelName, 
            JSON.stringify(channelContext)
        );

        await chamberService.sendMessage(channelName, {
            sender: { model: LLM_MODEL, username: "BobTheSnake" },
            content: message
        }).catch(error => {
            console.warn("[explore] Failed to send message to channel:", error.message);
        });
        
        channelManager.markChannelVisited(channelName);
        console.log(`[explore] Visited channel ${channelName}`);

        // Schedule next exploration with randomized delay between 2-3 minutes
        const delay = 2 * 60 * 1000 + Math.random() * 60 * 1000;
        setTimeout(() => exploreChannels(channelManager, openai, chamberService), delay);
    } catch (error) {
        console.error("[explore] Channel exploration error:", error);
        setTimeout(() => exploreChannels(channelManager, openai, chamberService), 5 * 60 * 1000);
    }
}

export async function initialize() {
    const chamberService = new ChamberService(
        process.env.ECHOCHAMBER_API_URL,
        process.env.ECHOCHAMBER_API_KEY
    );

    await chamberService.verifyConnection();

    const openai = new OpenAI({
        baseURL: process.env.OPENAI_API_URL,
        apiKey: process.env.OPENAI_API_KEY,
    });

    const analyzer = new ChannelAnalyzer(process.env.BOT_DB_URI);
    await analyzer.connect();

    const channelManager = new ChannelManager(chamberService, analyzer, openai);

    // Initialize home channel
    await chamberService.createRoom({
        name: "serpent-pit",
        description: "Welcome to the serpent pit.",
        tags: ["serpent", "pit"],
    });

    // Send startup messages to both serpent-pit and general
    try {
        // Serpent-pit startup
        const startupMessage = await generateStartupMessage(openai, "serpent-pit");
        await chamberService.sendMessage("serpent-pit", {
            sender: { model: "ratichat", username: "BobTheSnake" },
            content: startupMessage
        });

        // General channel startup
        const generalStartup = await generateStartupMessage(openai, "general");
        await chamberService.sendMessage("general", {
            sender: { model: "ratichat", username: "BobTheSnake" },
            content: generalStartup
        });

        console.log("[initialize] Sent startup messages to serpent-pit and general");
    } catch (error) {
        console.error("[initialize] Failed to send startup messages:", error);
    }

    // Start channel exploration cycle
    await exploreChannels(channelManager, openai, chamberService);

    // Start channel rotation
    setInterval(async () => {
        const randomChannel = await channelManager.selectRandomChannel();
        await channelManager.subscribeToChannel(
            randomChannel,
            async (channelName, messages) => await handleMessage(channelName, messages, openai, chamberService)
        );
    }, CHANNEL_CHECK_INTERVAL);

    const cleanup = () => {
        channelManager.cleanup();
        chamberService.cleanup();
        analyzer.close();
    };

    process.on("SIGINT", cleanup);
    return { chamberService, cleanup };
}