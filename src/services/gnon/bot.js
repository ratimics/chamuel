import OpenAI from "openai";
import { ChamberService } from "./chamberService.js";
import { ChannelAnalyzer } from '../analysis/channelAnalyzer.js';
import { ChannelManager } from './channels/channelManager.js';
import { ACTIONS } from './actions/handlers.js';
import { processLLMResponse, formatMessagesForContext, generateStructuredPrompt } from './llm/messageProcessor.js';
import { SYSTEM_PROMPT, RESPONSE_INSTRUCTIONS } from "../../config/index.js";

const CHANNEL_CHECK_INTERVAL = 5 * 60 * 1000;
const HOME_CHANNEL_CHECK_INTERVAL = 10 * 1000;  // 10 seconds
const CHANNEL_INACTIVITY_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
const MENTION_MONITORING_PERIOD = 24 * 60 * 60 * 1000; // 24 hours
const HOME_CHANNEL = "serpent-pit";
const LLM_MODEL = "nousresearch/hermes-3-llama-3.1-405b";
const state = { 
    lastActionTimes: {},
    currentChannel: null,
    lastChannelActivity: {},
    recentMentions: new Set(),
    lastMentionTimes: {}
};

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
        const result = await ACTIONS[parsed.action].handler(roomName, parsed.message, chamberService);
        
        // Record that Bob sent a message
        chamberService.channelManager.recordBobMessage(roomName);
        
        return result;
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
        // Get active channels where Bob wasn't last speaker
        const activeChannels = await channelManager.getActiveChannels();
        
        if (activeChannels.length === 0) {
            console.log("[explore] No active channels found, retrying in 2 minutes");
            setTimeout(() => exploreChannels(channelManager, openai, chamberService), 2 * 60 * 1000);
            return;
        }

        // Select a random channel from the top 3 most recently active
        const topChannels = activeChannels.slice(0, 3);
        const selectedChannel = topChannels[Math.floor(Math.random() * topChannels.length)];
        
        let channelContext = {};
        let entityProfiles = [];
        
        try {
            channelContext = await channelManager.analyzer.getChannelContext(selectedChannel.name);
            entityProfiles = await channelManager.analyzer.getRecentEntityProfiles(selectedChannel.name);
        } catch (dbError) {
            console.warn("[explore] Database access error:", dbError.message);
        }

        const message = await generateStartupMessage(
            openai, 
            selectedChannel.name, 
            JSON.stringify(channelContext)
        );

        await chamberService.sendMessage(selectedChannel.name, {
            sender: { model: LLM_MODEL, username: "BobTheSnake" },
            content: message
        });
        
        // Record Bob's message
        channelManager.recordBobMessage(selectedChannel.name);
        channelManager.markChannelVisited(selectedChannel.name);
        
        console.log(`[explore] Joined conversation in channel ${selectedChannel.name}`);

        // Schedule next exploration with randomized delay between 2-3 minutes
        const delay = 2 * 60 * 1000 + Math.random() * 60 * 1000;
        setTimeout(() => exploreChannels(channelManager, openai, chamberService), delay);
    } catch (error) {
        console.error("[explore] Channel exploration error:", error);
        setTimeout(() => exploreChannels(channelManager, openai, chamberService), 2 * 60 * 1000);
    }
}

async function checkForMentions(messages) {
    const mentions = messages.some(msg => 
        msg.content.toLowerCase().includes('bob') || 
        msg.content.toLowerCase().includes('snake')
    );
    
    if (mentions) {
        state.recentMentions.add(messages[0].channelName);
        state.lastMentionTimes[messages[0].channelName] = Date.now();
    }
}

async function shouldSwitchChannel(channelName) {
    const lastActivity = state.lastChannelActivity[channelName] || 0;
    return Date.now() - lastActivity > CHANNEL_INACTIVITY_THRESHOLD;
}

async function selectNextChannel(channelManager) {
    // Clean up old mentions
    for (const [channel, lastMention] of Object.entries(state.lastMentionTimes)) {
        if (Date.now() - lastMention > MENTION_MONITORING_PERIOD) {
            state.recentMentions.delete(channel);
            delete state.lastMentionTimes[channel];
        }
    }

    // If current channel is still active, stay there
    if (state.currentChannel && !await shouldSwitchChannel(state.currentChannel)) {
        return state.currentChannel;
    }

    // Check mentioned channels first
    for (const channel of state.recentMentions) {
        if (channel !== HOME_CHANNEL && channel !== state.currentChannel) {
            return channel;
        }
    }

    // Get a new unvisited channel
    const newChannel = await channelManager.getUnvisitedChannel();
    if (newChannel) {
        state.currentChannel = newChannel;
        state.lastChannelActivity[newChannel] = Date.now();
        return newChannel;
    }

    // Fallback to random channel
    return await channelManager.selectRandomChannel(HOME_CHANNEL);
}

export async function initialize() {
    try {
        const chamberService = new ChamberService(
            process.env.ECHOCHAMBER_API_URL,
            process.env.ECHOCHAMBER_API_KEY
        );

        console.log("[Bot] Verifying connection to server...");
        try {
            await chamberService.verifyConnection();
        } catch (error) {
            console.error("[Bot] Server connection failed:", error.message);
            console.error("[Bot] Please ensure the server is running and try again.");
            process.exit(1);
        }

        const openai = new OpenAI({
            baseURL: process.env.OPENAI_API_URL,
            apiKey: process.env.OPENAI_API_KEY,
        });

        const analyzer = new ChannelAnalyzer(process.env.MONGODB_URI);
        await analyzer.connect();

        const channelManager = new ChannelManager(chamberService, analyzer, openai);

        // Initialize home channel
        await chamberService.createRoom({
            name: HOME_CHANNEL,
            description: "Welcome to the serpent pit.",
            tags: ["serpent", "pit"],
        });

        // Send startup messages
        try {
            // Home channel startup
            const startupMessage = await generateStartupMessage(openai, HOME_CHANNEL);
            await chamberService.sendMessage(HOME_CHANNEL, {
                sender: { model: LLM_MODEL, username: "BobTheSnake" },
                content: startupMessage
            });

            // General channel startup
            const generalStartup = await generateStartupMessage(openai, "general");
            await chamberService.sendMessage("general", {
                sender: { model: LLM_MODEL, username: "BobTheSnake" },
                content: generalStartup
            });

            console.log("[initialize] Sent startup messages to home channel and general");
        } catch (error) {
            console.error("[initialize] Failed to send startup messages:", error);
        }

        // Set up dedicated monitoring for home channel
        await channelManager.subscribeToChannel(
            HOME_CHANNEL,
            async (channelName, messages) => await handleMessage(channelName, messages, openai, chamberService)
        );

        // Refresh home channel subscription periodically to ensure we don't miss messages
        setInterval(async () => {
            await channelManager.subscribeToChannel(
                HOME_CHANNEL,
                async (channelName, messages) => await handleMessage(channelName, messages, openai, chamberService)
            );
        }, HOME_CHANNEL_CHECK_INTERVAL);

        // Start channel exploration cycle
        await exploreChannels(channelManager, openai, chamberService);

        // Start channel rotation for non-home channels
        setInterval(async () => {
            const nextChannel = await selectNextChannel(channelManager);
            if (nextChannel && nextChannel !== state.currentChannel) {
                console.log(`[rotate] Moving to channel: ${nextChannel}`);
                
                // Subscribe to the new channel
                await channelManager.subscribeToChannel(
                    nextChannel,
                    async (channelName, messages) => {
                        // Update activity timestamp
                        state.lastChannelActivity[channelName] = Date.now();
                        
                        // Check for mentions in all messages
                        await checkForMentions(messages);
                        
                        // Only respond if it's the current active channel or if mentioned
                        if (channelName === state.currentChannel || state.recentMentions.has(channelName)) {
                            await handleMessage(channelName, messages, openai, chamberService);
                        }
                    }
                );
                
                // Send entrance message for new channel
                const message = await generateStartupMessage(openai, nextChannel);
                await chamberService.sendMessage(nextChannel, {
                    sender: { model: LLM_MODEL, username: "BobTheSnake" },
                    content: message
                });
            }
        }, CHANNEL_CHECK_INTERVAL);

        const cleanup = () => {
            channelManager.cleanup();
            chamberService.cleanup();
            analyzer.close();
        };

        process.on("SIGINT", cleanup);
        return { chamberService, cleanup };
    } catch (error) {
        console.error("[Bot] Fatal initialization error:", error.message);
        console.error("[Bot] Stack trace:", error.stack);
        process.exit(1);
    }
}