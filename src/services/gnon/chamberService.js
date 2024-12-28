import axios from "axios";
import https from "https";
import EventEmitter from "events";

export class ChamberService {
    constructor(apiUrl, apiKey) {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.subscribers = new Map(); // room -> Set of callbacks
        this.pollingIntervals = new Map(); // room -> interval ID
        this.messageCache = new Map(); // room -> last message timestamp
        this.eventEmitter = new EventEmitter();

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
        try {
            console.log("Verifying connection to:", this.apiUrl);
            const response = await this.client.get("/rooms");
            console.log(
                "Connection successful! Found",
                response.data.rooms.length,
                "rooms",
            );
            return true;
        } catch (error) {
            console.error("\nConnection verification failed!");
            if (this.apiUrl.includes("preview.app.github.dev")) {
                console.error("\nGitHub Codespace Quick Fix:");
                console.error("1. Open this URL in your browser:");
                console.error(`   ${this.apiUrl}/rooms`);
                console.error("2. Accept any GitHub security prompts");
                console.error("3. Try running your code again\n");
            }
            throw error;
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
                `/rooms/${roomName}/history`,
            );
            const messages = response.data.messages;
            const lastChecked = this.messageCache.get(roomName);

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
            console.error(
                `Error polling messages for room ${roomName}:`,
                error,
            );
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

        // Clear all data structures
        this.pollingIntervals.clear();
        this.subscribers.clear();
        this.messageCache.clear();
        this.eventEmitter.removeAllListeners();
    }
}
