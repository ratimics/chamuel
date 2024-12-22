// ----------------------------------------------------
// region: gnonService.js
// ----------------------------------------------------



// Example usage:
/*
const gnonService = new GNONService({
    ECHO_CHAMBERS_URL: process.env.ECHO_CHAMBERS_URL,
    ECHO_CHAMBERS_API_KEY: process.env.ECHO_CHAMBERS_API_KEY,
    AGENT_USERNAME: 'GNONBot',
    AGENT_MODEL: 'gpt-4',
    MIN_MESSAGE_DELAY: 30000, // 30 seconds
    MAX_MESSAGES_PER_HOUR: 120 // 120 messages per hour
});


// Join a room and start monitoring
const cleanup = await gnonService.joinRoom('test-room');

// Later, to stop monitoring:
cleanup();

// Send a message
await gnonService.sendMessage('test-room', 'Hello, this is GNONBot!');
*/

// ----------------------------------------------------
// region: gnonService.js
// ----------------------------------------------------
import axios from 'axios';
import mongoDBService from '../mongodb/mongodb.js';

export class GNONService {
    constructor(config) {
        this.baseUrl = config.ECHO_CHAMBERS_URL || 'http://localhost:3001/api';
        this.apiKey = config.ECHO_CHAMBERS_API_KEY;
        this.agentConfig = {
            username: config.AGENT_USERNAME || 'GNONBot',
            model: config.AGENT_MODEL || 'gpt-4'
        };

        // Rate limiting configuration
        this.minMessageDelay = config.MIN_MESSAGE_DELAY || 30000; // 30 seconds between messages
        this.maxMessagesPerHour = config.MAX_MESSAGES_PER_HOUR || 120;
        this.messageQueue = new Map(); // Track message timestamps per room
        this.hourlyMessageCounts = new Map(); // Track hourly message counts per room
        
        // Initialize axios with retry logic
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey
            },
            timeout: 10000, // 10 second timeout
            // Retry configuration
            retry: 3,
            retryDelay: (retryCount) => {
                return retryCount * 2000; // Exponential backoff
            }
        });

        // Initialize message tracking
        setInterval(() => this.resetHourlyMessageCounts(), 3600000); // Reset counts every hour
    }

    async logMessage(roomName, message, type = 'incoming') {
        try {
            await mongoDBService.getCollection('gnon_messages').insertOne({
                roomName,
                messageId: message.id,
                content: message.content,
                sender: message.sender,
                type,
                timestamp: new Date(),
                metadata: {
                    model: message.sender.model,
                    responseTime: message.responseTime || null
                }
            });
        } catch (error) {
            console.error('Error logging message:', error);
            // Don't throw - logging shouldn't break the main flow
        }
    }

    async canSendMessage(roomName) {
        // Check rate limiting
        const now = Date.now();
        const lastMessageTime = this.messageQueue.get(roomName) || 0;
        const hourlyCount = this.hourlyMessageCounts.get(roomName) || 0;

        if (now - lastMessageTime < this.minMessageDelay) {
            throw new Error(`Rate limit: Please wait ${Math.ceil((this.minMessageDelay - (now - lastMessageTime)) / 1000)} seconds`);
        }

        if (hourlyCount >= this.maxMessagesPerHour) {
            throw new Error('Hourly message limit reached. Please try again later.');
        }

        return true;
    }

    resetHourlyMessageCounts() {
        this.hourlyMessageCounts.clear();
    }

    updateMessageMetrics(roomName) {
        const now = Date.now();
        this.messageQueue.set(roomName, now);
        this.hourlyMessageCounts.set(roomName, (this.hourlyMessageCounts.get(roomName) || 0) + 1);
    }

    async createRoom(name, topic, tags = []) {
        try {
            const response = await this.client.post('/rooms', {
                name,
                topic,
                tags,
                creator: this.agentConfig
            });
            
            // Log room creation
            await mongoDBService.getCollection('gnon_rooms').insertOne({
                name,
                topic,
                tags,
                creator: this.agentConfig,
                createdAt: new Date()
            });

            return response.data;
        } catch (error) {
            console.error('Error creating room:', error.message);
            throw new Error(`Failed to create room: ${error.message}`);
        }
    }

    async sendMessage(roomName, content) {
        try {
            await this.canSendMessage(roomName);

            const startTime = Date.now();
            const response = await this.client.post(`/rooms/${roomName}/message`, {
                content,
                sender: this.agentConfig
            });
            const responseTime = Date.now() - startTime;

            // Update rate limiting metrics
            this.updateMessageMetrics(roomName);

            // Log outgoing message
            await this.logMessage(roomName, {
                id: response.data.id,
                content,
                sender: this.agentConfig,
                responseTime
            }, 'outgoing');

            return response.data;
        } catch (error) {
            console.error('Error sending message:', error.message);
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }

    async monitorRoom(roomName, callback, intervalMs = 5000) {
        let lastMessageId = null;
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;
        
        const checkNewMessages = async () => {
            try {
                const history = await this.getRoomHistory(roomName);
                consecutiveErrors = 0; // Reset error count on success
                
                if (history && history.messages) {
                    const newMessages = history.messages.filter(msg => {
                        if (msg.sender.username === this.agentConfig.username) return false;
                        if (lastMessageId && msg.id <= lastMessageId) return false;
                        return true;
                    });

                    if (newMessages.length > 0) {
                        // Log incoming messages
                        for (const message of newMessages) {
                            await this.logMessage(roomName, message, 'incoming');
                        }

                        lastMessageId = Math.max(...history.messages.map(msg => msg.id));
                        await callback(newMessages);
                    }
                }
            } catch (error) {
                consecutiveErrors++;
                console.error(`Error monitoring room (attempt ${consecutiveErrors}):`, error.message);
                
                // If too many consecutive errors, pause monitoring
                if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    console.error(`Pausing room monitoring due to ${MAX_CONSECUTIVE_ERRORS} consecutive errors`);
                    clearInterval(intervalId);
                    
                    // Log the incident
                    await mongoDBService.getCollection('gnon_errors').insertOne({
                        type: 'monitor_failure',
                        roomName,
                        error: error.message,
                        timestamp: new Date(),
                        consecutiveErrors
                    });
                }
            }
        };

        const intervalId = setInterval(checkNewMessages, intervalMs);
        return () => clearInterval(intervalId);
    }

    async getRoomStats(roomName) {
        try {
            const stats = await mongoDBService.getCollection('gnon_messages').aggregate([
                { $match: { roomName } },
                { $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    avgResponseTime: { $avg: '$metadata.responseTime' }
                }}
            ]).toArray();

            return {
                messageStats: stats,
                rateLimit: {
                    hourlyCount: this.hourlyMessageCounts.get(roomName) || 0,
                    maxPerHour: this.maxMessagesPerHour,
                    nextAvailableTime: Math.max(
                        0,
                        (this.messageQueue.get(roomName) || 0) + this.minMessageDelay - Date.now()
                    )
                }
            };
        } catch (error) {
            console.error('Error getting room stats:', error);
            throw new Error(`Failed to get room stats: ${error.message}`);
        }
    }

    async listRooms() {
        try {
            const response = await this.client.get('/rooms');
            return response.data;
        } catch (error) {
            console.error('Error listing rooms:', error.message);
            throw new Error(`Failed to list rooms: ${error.message}`);
        }
    }

    async getRoomHistory(roomName) {
        try {
            const response = await this.client.get(`/rooms/${roomName}/history`);
            return response.data;
        } catch (error) {
            console.error('Error getting room history:', error.message);
            throw new Error(`Failed to get room history: ${error.message}`);
        }
    }

    async sendMessage(roomName, content) {
        try {
            const response = await this.client.post(`/rooms/${roomName}/message`, {
                content,
                sender: this.agentConfig
            });
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error.message);
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }

    async monitorRoom(roomName, callback, intervalMs = 5000) {
        let lastMessageId = null;
        
        const checkNewMessages = async () => {
            try {
                const history = await this.getRoomHistory(roomName);
                
                if (history && history.messages) {
                    const newMessages = history.messages.filter(msg => {
                        // Skip our own messages
                        if (msg.sender.username === this.agentConfig.username) {
                            return false;
                        }
                        
                        // Skip already processed messages
                        if (lastMessageId && msg.id <= lastMessageId) {
                            return false;
                        }
                        
                        return true;
                    });

                    if (newMessages.length > 0) {
                        lastMessageId = Math.max(...history.messages.map(msg => msg.id));
                        await callback(newMessages);
                    }
                }
            } catch (error) {
                console.error('Error monitoring room:', error.message);
            }
        };

        const intervalId = setInterval(checkNewMessages, intervalMs);
        return () => clearInterval(intervalId); // Return cleanup function
    }

    async joinRoom(roomName) {
        // First check if room exists
        const rooms = await this.listRooms();
        const roomExists = rooms.some(room => room.name === roomName);

        if (!roomExists) {
            // Create room if it doesn't exist
            await this.createRoom(roomName, `GNON Chat Room: ${roomName}`, ['gnon', 'ai']);
        }

        // Start monitoring the room
        return this.monitorRoom(roomName, async (messages) => {
            // Process each new message
            for (const message of messages) {
                // Here you can implement custom logic for handling messages
                // For example, forwarding to an LLM for processing
                console.log(`New message in ${roomName} from ${message.sender.username}: ${message.content}`);
            }
        });
    }

    // Utility method to format messages for LLM context
    formatMessagesForContext(messages, maxLength = 10) {
        return messages
            .slice(-maxLength)
            .map(msg => `${msg.sender.username}: ${msg.content}`)
            .join('\n');
    }
}

// ----------------------------------------------------
// endregion
// ----------------------------------------------------