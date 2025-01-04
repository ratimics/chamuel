const MAX_ACTIVE_CHANNELS = 5;
const PERIODIC_MESSAGE_INTERVAL = 5 * 60 * 1000;

export class ChannelManager {
    constructor(chamberService, analyzer, openai) {
        this.chamberService = chamberService;
        this.analyzer = analyzer;
        this.openai = openai;
        this.activeChannels = new Set();
        this.visitedChannels = new Set();
        this.lastRoomsFetch = null;
        this.cachedRooms = [];
        this.lastMessages = new Map(); // Track last message per channel
        this.lastBobMessage = new Map(); // Track when Bob last spoke in each channel
    }

    async getRooms() {
        try {
            // Cache rooms for 1 minute to avoid hammering the API
            const now = Date.now();
            if (this.lastRoomsFetch && (now - this.lastRoomsFetch) < 60000) {
                return this.cachedRooms;
            }

            const response = await this.chamberService.client.get("/rooms");
            if (!response?.data?.rooms) {
                throw new Error("Invalid rooms response format");
            }

            this.cachedRooms = response.data.rooms;
            this.lastRoomsFetch = now;
            return this.cachedRooms;
        } catch (error) {
            console.error("[ChannelManager] Failed to fetch rooms:", error.message);
            // Return cached rooms if available, otherwise empty array
            return this.cachedRooms.length ? this.cachedRooms : [];
        }
    }

    async selectRandomChannel() {
        const rooms = await this.getRooms();
        if (rooms.length === 0) {
            throw new Error("No available rooms");
        }
        const randomIndex = Math.floor(Math.random() * rooms.length);
        return rooms[randomIndex].name;
    }

    async getUnvisitedChannel() {
        const rooms = await this.getRooms();
        if (rooms.length === 0) {
            console.warn("[ChannelManager] No rooms available, retrying in 30s");
            return new Promise((resolve) => {
                setTimeout(async () => {
                    resolve(await this.getUnvisitedChannel());
                }, 30000);
            });
        }

        const allChannels = rooms.map(room => room.name);
        const unvisitedChannels = allChannels.filter(channel => !this.visitedChannels.has(channel));
        
        if (unvisitedChannels.length === 0) {
            this.visitedChannels.clear(); // Reset cycle
            return allChannels[Math.floor(Math.random() * allChannels.length)];
        }
        
        return unvisitedChannels[Math.floor(Math.random() * unvisitedChannels.length)];
    }

    markChannelVisited(channelName) {
        this.visitedChannels.add(channelName);
    }

    async subscribeToChannel(channelName, messageHandler) {
        if (this.activeChannels.has(channelName)) return;

        this.activeChannels.add(channelName);
        const unsubscribe = this.chamberService.subscribe(channelName, 
            async (message) => await this.handleIncomingMessage(channelName, message, messageHandler)
        );

        this.cleanupOldSubscriptions();
        return unsubscribe;
    }

    async handleIncomingMessage(channelName, message, messageHandler) {
        const channelContext = await this.analyzer.getChannelContext(channelName);
        const entityProfile = await this.analyzer.getEntityProfile(message.username);
        
        const enhancedMessage = {
            ...message,
            channelContext,
            entityProfile
        };
        
        await messageHandler(channelName, [enhancedMessage]);
        await this.analyzer.updateChannelSummary(channelName, [message]);
    }

    cleanupOldSubscriptions() {
        if (this.activeChannels.size > MAX_ACTIVE_CHANNELS) {
            const oldestChannel = Array.from(this.activeChannels)[0];
            this.activeChannels.delete(oldestChannel);
            this.chamberService.unsubscribe(oldestChannel);
        }
    }

    cleanup() {
        this.activeChannels.forEach(channel => {
            this.chamberService.unsubscribe(channel);
        });
        this.activeChannels.clear();
    }

    async getActiveChannels() {
        const rooms = await this.getRooms();
        const activeChannels = [];

        for (const room of rooms) {
            try {
                // Get last 5 messages from each channel
                const messages = await this.chamberService.getMessages(room.name, 5);
                
                // Skip if no messages or if Bob was the last speaker
                if (!messages.length) continue;
                
                const lastMessage = messages[0];
                const lastBobTime = this.lastBobMessage.get(room.name) || 0;
                const lastMessageTime = new Date(lastMessage.timestamp).getTime();

                // Store last message time
                this.lastMessages.set(room.name, lastMessageTime);

                const lastUser = lastMessage?.sender?.username || lastMessage.username;

                // Add channel if there are messages and Bob wasn't last speaker
                if (lastUser !== "Chamuel" && 
                    lastMessageTime > lastBobTime) {
                    activeChannels.push({
                        name: room.name,
                        lastActivity: lastMessageTime
                    });
                }
            } catch (error) {
                console.warn(`[ChannelManager] Failed to get messages for ${room.name}:`, error.message);
            }
        }

        // Sort by most recent activity
        return activeChannels.sort((a, b) => b.lastActivity - a.lastActivity);
    }

    recordBobMessage(channelName) {
        this.lastBobMessage.set(channelName, Date.now());
    }
}
