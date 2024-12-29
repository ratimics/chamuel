import axios from "axios";
import https from "https";
import EventEmitter from "events";

const INITIAL_RETRY_DELAY = 30000; // 30 seconds
const MAX_RETRY_DELAY = 30 * 60 * 1000; // 30 minutes
const MAX_CONSECUTIVE_ERRORS = 5;

export class ChamberService {
    constructor(apiUrl, apiKey) {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.subscribers = new Map(); // room -> Set of callbacks
        this.pollingIntervals = new Map(); // room -> interval ID
        this.messageCache = new Map(); // room -> last message timestamp
        this.eventEmitter = new EventEmitter();
        this.roomRetries = new Map(); // room -> {delay, errors, timeout}
        this.maxRetries = 3;
        this.retryDelay = 5000; // 5 seconds

        // Create axios instance with GitHub-friendly config
        this.client = axios.create({
            baseURL: this.apiUrl,
            headers: {
                "Content-Type": "application/json",
                "x-api-key": this.apiKey,
                Accept: "*/*",
            },
            httpsAgent: new https.Agent({
                rejectUnauthorized: false, // Only for development
            }),
            timeout: 15000,
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 500,
        });

        // Add response interceptor for better error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.code === "ECONNREFUSED") {
                    console.error("\nConnection refused. Please check:");
                    console.error(
                        "1. The port is forwarded in GitHub Codespaces",
                    );
                    console.error("2. The API URL is correct:", this.apiUrl);
                    console.error(
                        "3. If using GitHub Codespaces, open this URL in browser first:",
                    );
                    console.error(`   ${this.apiUrl}/rooms\n`);
                }
                if (error.response?.status === 502) {
                    console.warn(`[ChamberService] Server temporarily unavailable (502)`);
                    return Promise.reject(error);
                }
                throw error;
            },
        );
    }

    async checkRoomExists(roomName) {
        try {
            const response = await this.client.get("/rooms");
            const roomExists = response.data.rooms.some(
                (room) => room.name.toLowerCase() === roomName.toLowerCase(),
            );

            return roomExists;
        } catch (error) {
            console.error("Error checking room existence:", error.message);
            throw error;
        }
    }

    async createRoom(roomData) {
        try {
            if (await this.checkRoomExists(roomData.name.replace("#", ""))) {
                console.log(`Room ${roomData.name} already exists`);
                return;
            }
            await this.client.post("/rooms", roomData);
        } catch (error) {
            console.error("Room creation error:", error.message);
            throw error;
        }
    }

    async sendMessage(roomName, messageData) {
        try {
            await this.client.post(
                `/rooms/${roomName.replace("#", "")}/message`,
                messageData,
            );
        } catch (error) {
            console.error("Message sending error:", error.message);
            throw error;
        }
    }

    // Helper method to verify connection
    async verifyConnection() {
        let attempts = 0;
        
        while (attempts < this.maxRetries) {
            try {
                const response = await this.client.get("/health");
                if (response?.data?.status === "ok") {
                    console.log("[ChamberService] Successfully connected to server");
                    return true;
                }
                throw new Error("Invalid health check response");
            } catch (error) {
                attempts++;
                const isLastAttempt = attempts === this.maxRetries;
                
                if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                    console.error(`[ChamberService] Server appears to be offline (attempt ${attempts}/${this.maxRetries})`);
                } else if (error.response?.status === 401) {
                    throw new Error("Authentication failed - invalid API key");
                } else {
                    console.error(`[ChamberService] Connection error (attempt ${attempts}/${this.maxRetries}):`, 
                        error.message || "Unknown error");
                }

                if (isLastAttempt) {
                    throw new Error("Failed to connect to server after multiple attempts - is the server running?");
                }

                console.log(`Retrying in ${this.retryDelay/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
        }
    }

    /**
     * Subscribe to messages in a specific room
     * @param {string} roomName - Name of the room to subscribe to
     * @param {Function} callback - Callback function to handle new messages
     * @param {number} pollInterval - Optional polling interval in milliseconds (default: 5000)
     * @returns {Function} Unsubscribe function
     */
    subscribe(roomName, callback, pollInterval = 5000) {
        const normalizedRoom = roomName.replace("#", "").toLowerCase();

        // Initialize subscriber set for this room if it doesn't exist
        if (!this.subscribers.has(normalizedRoom)) {
            this.subscribers.set(normalizedRoom, new Set());
            this.messageCache.set(normalizedRoom, new Date().toISOString());
        }

        // Add subscriber
        this.subscribers.get(normalizedRoom).add(callback);

        // Start polling if not already polling for this room
        if (!this.pollingIntervals.has(normalizedRoom)) {
            const intervalId = setInterval(
                () => this.pollMessages(normalizedRoom),
                pollInterval,
            );
            this.pollingIntervals.set(normalizedRoom, intervalId);
        }

        // Return unsubscribe function
        return () => this.unsubscribe(normalizedRoom, callback);
    }

    /**
     * Unsubscribe from room messages
     * @param {string} roomName - Name of the room to unsubscribe from
     * @param {Function} callback - Callback function to remove
     */
    unsubscribe(roomName, callback) {
        const normalizedRoom = roomName.replace("#", "").toLowerCase();
        const subscribers = this.subscribers.get(normalizedRoom);

        if (subscribers) {
            subscribers.delete(callback);

            // If no more subscribers, stop polling and clean up
            if (subscribers.size === 0) {
                const intervalId = this.pollingIntervals.get(normalizedRoom);
                if (intervalId) {
                    clearInterval(intervalId);
                    this.pollingIntervals.delete(normalizedRoom);
                }
                this.subscribers.delete(normalizedRoom);
                this.messageCache.delete(normalizedRoom);
            }
        }
    }

    /**
     * Poll for new messages in a room
     * @param {string} roomName - Name of the room to poll
     * @private
     */
    async pollMessages(roomName) {
        try {
            const response = await this.client.get(
                `/rooms/${roomName}/messages`,
            );

            // Validate response data
            if (!response.data?.messages) {
                throw new Error('Invalid response format');
            }

            const messages = response.data.messages;
            const lastChecked = this.messageCache.get(roomName);

            // Reset retry state on successful poll
            this.resetRetryState(roomName);

            // Filter and emit new messages
            const newMessages = messages.filter(
                (msg) => new Date(msg.timestamp) > new Date(lastChecked),
            );

            if (newMessages.length > 0) {
                // Update last checked timestamp
                this.messageCache.set(
                    roomName,
                    newMessages[newMessages.length - 1].timestamp,
                );

                // Notify all subscribers
                const subscribers = this.subscribers.get(roomName);
                if (subscribers) {
                    newMessages.forEach((message) => {
                        subscribers.forEach((callback) => callback(message));
                    });
                }

                // Emit event for anyone using event-based listening
                this.eventEmitter.emit("newMessages", {
                    room: roomName,
                    messages: newMessages,
                });
            }
        } catch (error) {
            await this.handleRoomError(roomName, error);
        }
    }

    /**
     * Listen for new messages using events instead of callbacks
     * @param {Function} listener - Event listener function
     * @returns {Function} Function to remove the listener
     */
    onNewMessages(listener) {
        this.eventEmitter.on("newMessages", listener);
        return () => this.eventEmitter.off("newMessages", listener);
    }

    /**
     * Stop all polling and clear all subscriptions
     */
    cleanup() {
        // Clear all polling intervals
        for (const [room, intervalId] of this.pollingIntervals) {
            clearInterval(intervalId);
        }

        // Clear all retry timeouts
        for (const [room, state] of this.roomRetries) {
            if (state.timeout) {
                clearTimeout(state.timeout);
            }
        }

        // Clear all data structures
        this.pollingIntervals.clear();
        this.subscribers.clear();
        this.messageCache.clear();
        this.roomRetries.clear();
        this.eventEmitter.removeAllListeners();
    }

    getRetryState(roomName) {
        if (!this.roomRetries.has(roomName)) {
            this.roomRetries.set(roomName, {
                delay: INITIAL_RETRY_DELAY,
                errors: 0,
                timeout: null
            });
        }
        return this.roomRetries.get(roomName);
    }

    resetRetryState(roomName) {
        const state = this.getRetryState(roomName);
        state.delay = INITIAL_RETRY_DELAY;
        state.errors = 0;
        if (state.timeout) {
            clearTimeout(state.timeout);
            state.timeout = null;
        }
    }

    async handleRoomError(roomName, error) {
        const state = this.getRetryState(roomName);
        state.errors++;

        console.warn(`[ChamberService] Room ${roomName} error (${state.errors}/${MAX_CONSECUTIVE_ERRORS}):`, error.message);

        if (state.errors >= MAX_CONSECUTIVE_ERRORS) {
            // Implement exponential backoff
            state.delay = Math.min(state.delay * 2, MAX_RETRY_DELAY);
            console.log(`[ChamberService] Room ${roomName} cooling down for ${state.delay/1000}s`);
            
            // Schedule retry
            if (state.timeout) clearTimeout(state.timeout);
            state.timeout = setTimeout(() => {
                console.log(`[ChamberService] Retrying room ${roomName}`);
                this.resetRetryState(roomName);
                this.pollMessages(roomName).catch(e => 
                    console.warn(`[ChamberService] Retry failed for ${roomName}:`, e.message)
                );
            }, state.delay);

            // Temporarily unsubscribe
            const subscribers = this.subscribers.get(roomName);
            if (subscribers) {
                this.subscribers.delete(roomName);
                const intervalId = this.pollingIntervals.get(roomName);
                if (intervalId) {
                    clearInterval(intervalId);
                    this.pollingIntervals.delete(roomName);
                }
            }
        }
    }

    async getMessages(roomName, limit = 5) {
        try {
            const response = await this.client.get(
                `/rooms/${roomName.replace("#", "")}/messages`,
                { params: { limit } }
            );

            if (!response?.data?.messages) {
                throw new Error('Invalid response format for message history');
            }

            return response.data.messages;
        } catch (error) {
            console.error(`[ChamberService] Failed to get messages for ${roomName}:`, error.message);
            return [];
        }
    }
}
