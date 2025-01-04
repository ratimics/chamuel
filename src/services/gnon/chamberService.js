import axios from "axios";
import https from "https";
import EventEmitter from "events";

const INITIAL_RETRY_DELAY = 30000;       // 30 seconds
const MAX_RETRY_DELAY = 30 * 60 * 1000; // 30 minutes
const MAX_CONSECUTIVE_ERRORS = 5;
const BOT_MODEL = "meta-llama/Llama-3.3-70B-Instruct";
const BOT_NAME = "Chamuel";

export class ChamberService {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.subscribers = new Map();    // roomName -> Set<callback(messages[])>
    this.pollingIntervals = new Map();  // roomName -> interval ID
    this.messageCache = new Map();      // roomName -> last message timestamp
    this.eventEmitter = new EventEmitter();
    this.roomRetries = new Map();       // roomName -> { delay, errors, timeout }
    this.maxRetries = 3;               // verifyConnection attempts
    this.retryDelay = 5000;            // 5 seconds between attempts

    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        Accept: "*/*",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }), // For dev/self-signed
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 500,
    });

    // Handle some common connection errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.code === "ECONNREFUSED") {
          console.error("\n[ChamberService] Connection refused. Possible fixes:\n" +
            "1. Make sure the server is running and port is forwarded (Codespaces/Docker).\n" +
            "2. Confirm the API URL is correct:\n   " + this.apiUrl + "\n" +
            "3. If using GitHub Codespaces, open the URL in a browser at least once:\n   " + this.apiUrl + "/rooms\n"
          );
        }
        if (error.response?.status === 502) {
          console.warn("[ChamberService] Server temporarily unavailable (502).");
          return Promise.reject(error);
        }
        throw error;
      },
    );
  }

  /**
   * Verifies the server is online by attempting to fetch /rooms.
   * Retries up to maxRetries times if the server is unreachable.
   */
  async verifyConnection() {
    let attempts = 0;

    while (attempts < this.maxRetries) {
      try {
        const response = await this.client.get("/rooms");
        if (response?.data?.rooms) {
          console.log("[ChamberService] Successfully connected to server.");
          return true;
        }
        throw new Error("Invalid or empty /rooms response");
      } catch (error) {
        attempts++;
        const isLastAttempt = attempts === this.maxRetries;

        if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
          console.error(`[ChamberService] Server offline? (attempt ${attempts}/${this.maxRetries})`);
        } else if (error.response?.status === 401) {
          throw new Error("Authentication failed: invalid API key");
        } else {
          console.error(`[ChamberService] Connection error (attempt ${attempts}/${this.maxRetries}):`, error.message);
        }

        if (isLastAttempt) {
          throw new Error("[ChamberService] Unable to connect after multiple retries. Server down?");
        }

        console.log(`[ChamberService] Retrying in ${this.retryDelay / 1000}s...`);
        await new Promise((r) => setTimeout(r, this.retryDelay));
      }
    }
  }

  /**
   * Returns a list of all rooms from the server.
   */
  async listChannels() {
    try {
      const response = await this.client.get("/rooms");
      if (!response?.data?.rooms) {
        throw new Error("No 'rooms' array in server response");
      }
      return response.data.rooms;
    } catch (error) {
      console.error("[ChamberService] Error listing channels:", error.message);
      throw error;
    }
  }

  /**
   * Checks if a room with the given name exists (case-insensitive).
   */
  async checkRoomExists(roomName) {
    try {
      const response = await this.client.get("/rooms");
      return response.data.rooms.some(
        (room) => room.name.toLowerCase() === roomName.toLowerCase()
      );
    } catch (error) {
      console.error("[ChamberService] Error checking room existence:", error.message);
      throw error;
    }
  }

  /**
   * Create a room if it doesn't already exist.
   */
  async createRoom(roomData) {
    try {
      const normalizedName = roomData.name.replace("#", "").toLowerCase();
      const exists = await this.checkRoomExists(normalizedName);
      if (exists) {
        console.log(`[ChamberService] Room "${roomData.name}" already exists.`);
        return;
      }
      const resp = await this.client.post("/rooms", roomData);
      if (resp.data?.error) {
        throw new Error(resp.data.error);
      }
      console.log(`[ChamberService] Room "${roomData.name}" created.`);
    } catch (error) {
      console.error("[ChamberService] Room creation error:", error.message);
      throw error;
    }
  }

  /**
   * Send a message to the specified room.
   */
  async sendMessage(roomName, messageData) {
    try {
      const normalizedRoom = roomName.replace("#", "");
      const response = await this.client.post(`/rooms/${normalizedRoom}/message`, messageData, {
        headers: { "x-api-key": this.apiKey },
      });
      console.log("[ChamberService] Message sent:", response.data);
      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      return response.data;
    } catch (error) {
      console.error("[ChamberService] Message sending error:", error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Subscribes to a room's messages, polling at `pollInterval`.
   * Callback receives an array of new messages each poll cycle.
   * Returns an unsubscribe function.
   */
  subscribe(roomName, callback, pollInterval = 5000) {
    const normalizedRoom = roomName.replace("#", "").toLowerCase();

    // Initialize subscription set if none exists
    if (!this.subscribers.has(normalizedRoom)) {
      this.subscribers.set(normalizedRoom, new Set());
      // Use the current time as the "last seen" message time
      this.messageCache.set(normalizedRoom, new Date().toISOString());
    }

    // Add the new subscriber
    this.subscribers.get(normalizedRoom).add(callback);

    // If we're not already polling this room, start polling
    if (!this.pollingIntervals.has(normalizedRoom)) {
      const intervalId = setInterval(() => this.pollMessages(normalizedRoom), pollInterval);
      this.pollingIntervals.set(normalizedRoom, intervalId);
    }

    // Return unsubscribe function
    return () => this.unsubscribe(normalizedRoom, callback);
  }

  /**
   * Unsubscribe a specific callback from a room.
   * If no more subscribers remain, polling for that room is stopped.
   */
  unsubscribe(roomName, callback) {
    const subs = this.subscribers.get(roomName);
    if (subs) {
      subs.delete(callback);
      if (subs.size === 0) {
        // Stop polling
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
   * Poll the room's history endpoint, find newly arrived messages,
   * and notify subscribers with an array of new messages.
   */
  async pollMessages(roomName) {
    try {
      const response = await this.client.get(`/rooms/${roomName}/history`);
      if (!response?.data) {
        throw new Error("Invalid response data");
      }
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      if (!response.data.messages) {
        throw new Error("Response missing 'messages' array");
      }

      // We have valid data
      this.resetRetryState(roomName);

      const allMessages = response.data.messages;
      const lastChecked = this.messageCache.get(roomName) || "1970-01-01T00:00:00Z";
      const newMessages = allMessages.filter(
        (msg) => new Date(msg.timestamp) > new Date(lastChecked)
      );

      if (newMessages.length > 0) {
        // Update last seen message time
        const latestTimestamp = newMessages[newMessages.length - 1].timestamp;
        this.messageCache.set(roomName, latestTimestamp);

        // Notify each subscriber with the array of new messages
        const subs = this.subscribers.get(roomName);
        if (subs) {
          subs.forEach((cb) => cb(newMessages));
        }

        // Emit an event for optional event-based listeners
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
   * Returns a function to stop listening to 'newMessages' events.
   */
  onNewMessages(listener) {
    this.eventEmitter.on("newMessages", listener);
    return () => this.eventEmitter.off("newMessages", listener);
  }

  /**
   * Clean up everything: intervals, timeouts, subscribers, etc.
   */
  cleanup() {
    // Clear intervals
    for (const intervalId of this.pollingIntervals.values()) {
      clearInterval(intervalId);
    }
    // Clear timeouts
    for (const roomState of this.roomRetries.values()) {
      if (roomState.timeout) {
        clearTimeout(roomState.timeout);
      }
    }

    this.pollingIntervals.clear();
    this.subscribers.clear();
    this.messageCache.clear();
    this.roomRetries.clear();
    this.eventEmitter.removeAllListeners();
  }

  /**
   * Fetch up to 'limit' messages from the room's history (for manual usage).
   */
  async getMessages(roomName, limit = 5) {
    try {
      const normalized = roomName.replace("#", "");
      const response = await this.client.get(`/rooms/${normalized}/history`, { params: { limit } });
      if (!response.data?.messages) {
        throw new Error("No 'messages' array in response");
      }
      return response.data.messages;
    } catch (error) {
      console.error(`[ChamberService] Failed to get messages for "${roomName}":`, error.message);
      return [];
    }
  }

  /**
   * Retrieve or initialize retry state for a given room.
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
   * Reset a room's error/cooldown counters.
   */
  resetRetryState(roomName) {
    const state = this.getRetryState(roomName);
    state.delay = INITIAL_RETRY_DELAY;
    state.errors = 0;
    if (state.timeout) {
      clearTimeout(state.timeout);
      state.timeout = null;
    }
  }

  /**
   * Handle errors in pollMessages with exponential backoff.
   */
  async handleRoomError(roomName, error) {
    const state = this.getRetryState(roomName);
    state.errors++;

    console.warn(
      `[ChamberService] Room "${roomName}" error (${state.errors}/${MAX_CONSECUTIVE_ERRORS}):`,
      error.message
    );

    if (state.errors >= MAX_CONSECUTIVE_ERRORS) {
      // Exponential backoff
      state.delay = Math.min(state.delay * 2, MAX_RETRY_DELAY);
      console.log(`[ChamberService] Room "${roomName}" cooling down for ${state.delay / 1000}s`);

      // Schedule a retry
      if (state.timeout) clearTimeout(state.timeout);
      state.timeout = setTimeout(() => {
        console.log(`[ChamberService] Retrying room "${roomName}"`);
        this.resetRetryState(roomName);
        this.pollMessages(roomName).catch((e) =>
          console.warn(`[ChamberService] Retry failed for "${roomName}":`, e.message)
        );
      }, state.delay);

      // Temporarily unsubscribe this room
      const subs = this.subscribers.get(roomName);
      if (subs) {
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