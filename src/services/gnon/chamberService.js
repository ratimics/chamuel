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
    this.subscribers = new Map();    // room -> Set of callbacks
    this.pollingIntervals = new Map(); // room -> interval ID
    this.messageCache = new Map();     // room -> last message timestamp
    this.eventEmitter = new EventEmitter();
    this.roomRetries = new Map();      // room -> { delay, errors, timeout }
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
        rejectUnauthorized: false, // Only for dev or self-signed certs
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
          console.error("\n[ChamberService] Connection refused. Please check:");
          console.error("1. The port is forwarded in GitHub Codespaces (or Docker).");
          console.error("2. The API URL is correct:", this.apiUrl);
          console.error("3. If using GitHub Codespaces, open this URL in browser first:");
          console.error(`   ${this.apiUrl}/rooms\n`);
        }
        if (error.response?.status === 502) {
          console.warn("[ChamberService] Server temporarily unavailable (502)");
          return Promise.reject(error);
        }
        throw error;
      },
    );
  }

  /**
   * Verify the server is reachable and returns a list of rooms.
   * Throws if it cannot connect after multiple retries.
   */
  async verifyConnection() {
    let attempts = 0;

    while (attempts < this.maxRetries) {
      try {
        const response = await this.client.get("/rooms");
        if (!!response?.data?.rooms) {
          console.log("[ChamberService] Successfully connected to server");
          return true;
        }
        throw new Error("Invalid health check response");
      } catch (error) {
        attempts++;
        const isLastAttempt = attempts === this.maxRetries;

        if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
          console.error(
            `[ChamberService] Server appears to be offline (attempt ${attempts}/${this.maxRetries})`,
          );
        } else if (error.response?.status === 401) {
          throw new Error("Authentication failed - invalid API key");
        } else {
          console.error(
            `[ChamberService] Connection error (attempt ${attempts}/${this.maxRetries}):`,
            error.message || "Unknown error",
          );
        }

        if (isLastAttempt) {
          throw new Error(
            "[ChamberService] Failed to connect to server after multiple attempts - is the server running?",
          );
        }

        console.log(`[ChamberService] Retrying in ${this.retryDelay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  /**
   * List all channels/rooms from the server.
   * @returns {Promise<Array>} - Array of room objects.
   */
  async listChannels() {
    try {
      const response = await this.client.get("/rooms");
      if (!response?.data?.rooms) {
        throw new Error("No rooms found in response data");
      }
      return response.data.rooms; 
    } catch (error) {
      console.error("[ChamberService] Error listing channels:", error.message);
      throw error;
    }
  }

  /**
   * Checks if a room exists (case-insensitive name match).
   */
  async checkRoomExists(roomName) {
    try {
      const response = await this.client.get("/rooms");
      const roomExists = response.data.rooms.some(
        (room) => room.name.toLowerCase() === roomName.toLowerCase(),
      );
      return roomExists;
    } catch (error) {
      console.error("[ChamberService] Error checking room existence:", error.message);
      throw error;
    }
  }

  /**
   * Create a room if it doesn't exist.
   * @param {Object} roomData
   */
  async createRoom(roomData) {
    try {
      const normalizedName = roomData.name.replace("#", "").toLowerCase();
      if (await this.checkRoomExists(normalizedName)) {
        console.log(`[ChamberService] Room "${roomData.name}" already exists`);
        return;
      }
      const resp = await this.client.post("/rooms", roomData);
      if (resp.data?.error) {
        throw new Error(resp.data.error);
      }
      console.log(`[ChamberService] Room "${roomData.name}" created successfully`);
    } catch (error) {
      console.error("[ChamberService] Room creation error:", error.message);
      throw error;
    }
  }

  /**
   * Send a message to a room.
   * @param {string} roomName 
   * @param {Object} messageData 
   */
  async sendMessage(roomName, messageData) {
    try {
      const normalizedRoomName = roomName.replace("#", "");
      const response = await this.client.post(
        `/rooms/${normalizedRoomName}/message`,
        messageData,
        {
          headers: {
            "x-api-key": this.apiKey,
          },
        },
      );
      console.log("[ChamberService] Message sent:", response.data);

      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      return response.data;
    } catch (error) {
      console.error(
        "[ChamberService] Message sending error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  /**
   * Subscribe to messages in a specific room at a given polling interval.
   * @param {string} roomName
   * @param {Function} callback - Called with each new message
   * @param {number} pollInterval - default 5000ms
   * @returns {Function} unsubscribe function
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
   * Unsubscribe from a specific room's messages.
   */
  unsubscribe(roomName, callback) {
    const subscribers = this.subscribers.get(roomName);
    if (subscribers) {
      subscribers.delete(callback);

      // If no more subscribers, stop polling and clean up
      if (subscribers.size === 0) {
        const intervalId = this.pollingIntervals.get(roomName);
        if (intervalId) {
          clearInterval(intervalId);
          this.pollingIntervals.delete(roomName);
        }
        this.subscribers.delete(roomName);
        this.messageCache.delete(roomName);
      }
    }
  }

  /**
   * Core polling logic to fetch new messages from a room.
   * @private
   */
  async pollMessages(roomName) {
    try {
      const response = await this.client.get(`/rooms/${roomName}/messages`);

      // Validate response data
      if (!response.data?.messages) {
        throw new Error("Invalid response format, 'messages' missing");
      }

      const messages = response.data.messages;
      const lastChecked = this.messageCache.get(roomName);

      // Reset retry state on successful poll
      this.resetRetryState(roomName);

      // Filter and emit only newly arrived messages
      const newMessages = messages.filter(
        (msg) => new Date(msg.timestamp) > new Date(lastChecked),
      );

      if (newMessages.length > 0) {
        // Update cache timestamp to the newest message
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

        // Emit event for event-based consumers
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
   * Event-based interface for listening to new messages across all rooms.
   * @param {Function} listener - Invoked with { room, messages } object
   * @returns {Function} to remove the listener
   */
  onNewMessages(listener) {
    this.eventEmitter.on("newMessages", listener);
    return () => this.eventEmitter.off("newMessages", listener);
  }

  /**
   * Stop all polling intervals and clear all subscriptions.
   */
  cleanup() {
    // Clear all polling intervals
    for (const [, intervalId] of this.pollingIntervals) {
      clearInterval(intervalId);
    }

    // Clear all retry timeouts
    for (const [, retryState] of this.roomRetries) {
      if (retryState.timeout) {
        clearTimeout(retryState.timeout);
      }
    }

    this.pollingIntervals.clear();
    this.subscribers.clear();
    this.messageCache.clear();
    this.roomRetries.clear();
    this.eventEmitter.removeAllListeners();
  }

  /**
   * Retrieves up to 'limit' recent messages for a room.
   */
  async getMessages(roomName, limit = 5) {
    try {
      const normalizedRoomName = roomName.replace("#", "");
      const response = await this.client.get(`/rooms/${normalizedRoomName}/messages`, {
        params: { limit },
      });
      if (!response?.data?.messages) {
        throw new Error("Invalid response format for message history");
      }
      return response.data.messages;
    } catch (error) {
      console.error(
        `[ChamberService] Failed to get messages for '${roomName}':`,
        error.message,
      );
      return [];
    }
  }

  /**
   * Retrieve or create a retry state object for a specific room.
   */
  getRetryState(roomName) {
    if (!this.roomRetries.has(roomName)) {
      this.roomRetries.set(roomName, {
        delay: INITIAL_RETRY_DELAY,
        errors: 0,
        timeout: null,
      });
    }
    return this.roomRetries.get(roomName);
  }

  /**
   * Reset the retry/cooldown state for a room back to defaults.
   */
  resetRetryState(roomName) {
    const retryState = this.getRetryState(roomName);
    retryState.delay = INITIAL_RETRY_DELAY;
    retryState.errors = 0;
    if (retryState.timeout) {
      clearTimeout(retryState.timeout);
      retryState.timeout = null;
    }
  }

  /**
   * Handle room polling errors with exponential backoff, unsubscribing temporarily.
   */
  async handleRoomError(roomName, error) {
    const retryState = this.getRetryState(roomName);
    retryState.errors++;

    console.warn(
      `[ChamberService] Room "${roomName}" error (${retryState.errors}/${MAX_CONSECUTIVE_ERRORS}):`,
      error.message,
    );

    if (retryState.errors >= MAX_CONSECUTIVE_ERRORS) {
      // Exponential backoff
      retryState.delay = Math.min(retryState.delay * 2, MAX_RETRY_DELAY);
      console.log(
        `[ChamberService] Room "${roomName}" cooling down for ${
          retryState.delay / 1000
        }s`,
      );

      // Schedule next retry
      if (retryState.timeout) clearTimeout(retryState.timeout);
      retryState.timeout = setTimeout(() => {
        console.log(`[ChamberService] Retrying room "${roomName}"`);
        this.resetRetryState(roomName);
        this.pollMessages(roomName).catch((e) =>
          console.warn(`[ChamberService] Retry failed for "${roomName}":`, e.message),
        );
      }, retryState.delay);

      // Temporarily unsubscribe from that room
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
}