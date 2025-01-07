// Required imports
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { CONFIG } from '../../config/index.js';

import { setupMessageHandlers } from '../../utils/messageHandlers.js';
import axios from 'axios';
import axiosRetry from 'axios-retry';

import { openai } from '../../config/index.js'; // Import OpenAI instance

import { FileOps } from '../../utils/mediaHandlers.js';
import { MessageService } from './messageService.js';
import { MediaService } from '../media/mediaService.js';


// Update RECONNECT_CONFIG
const RECONNECT_CONFIG = {
  maxAttempts: 10,
  initialDelay: 2000, // Increased initial delay
  maxDelay: 60000,    // Increased max delay
  timeout: 60000      // Increased timeout to 60 seconds
};

// Add request configuration
const REQUEST_CONFIG = {
  timeout: 60000,     // Increased timeout to 60 seconds
  retries: 3,
  retryDelay: 1000
};

// Configure axios with retry logic
axiosRetry(axios, {
  retries: REQUEST_CONFIG.retries,
  retryDelay: (retryCount) => {
    return retryCount * REQUEST_CONFIG.retryDelay;
  },
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           error.code === 'ECONNRESET';
  }
});

// Promisify readFile and writeFile
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);


// Utility functions for file operations
const FileOps = {
  async readJSON(filepath) {
    try {
      const data = await readFileAsync(filepath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${filepath}:`, error);
      return null;
    }
  },

  async writeJSON(filepath, data) {
    try {
      await writeFileAsync(filepath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing ${filepath}:`, error);
      return false;
    }
  }
};

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bot state management (This part might be redundant with the new class)
const state = {
  chatHistories: {},
  lastResponseTimes: {},
  messageQueues: {},
  processedMessages: new Set(),
};

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.initialize();
  }

  initialize() {
    const options = {
      polling: {
        autoStart: false,
        params: {
          timeout: RECONNECT_CONFIG.timeout
        }
      },
      request: {
        timeout: REQUEST_CONFIG.timeout,
        headers: CONFIG.REQUEST_HEADERS,
        forever: true, // Keep-alive
        pool: {
          maxSockets: 100
        }
      }
    };

    this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN, options);
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.bot.on('polling_error', this.handlePollingError.bind(this));
    this.bot.on('error', this.handleError.bind(this));
    this.setupMessageHandlers();
  }

  async setupMessageHandlers() {
    // Text messages
    this.bot.on('text', async (msg) => {
      try {
        await MessageService.storeAssistantMessage(msg.chat.id, [{
          type: 'text',
          text: msg.text
        }]);
        await setupMessageHandlers(this.bot, openai);
      } catch (error) {
        console.error('Error handling text message:', error);
      }
    });

    // Photo messages
    this.bot.on('photo', async (msg) => {
      try {
        const photo = msg.photo[msg.photo.length - 1];
        const fileId = photo.file_id;
        const file = await this.bot.getFile(fileId);
        const mediaUrl = await MediaService.uploadMediaToS3(file.file_path);

        await MessageService.storeAssistantMessage(msg.chat.id, [{
          type: 'image',
          url: mediaUrl
        }]);
      } catch (error) {
        console.error('Error handling photo:', error);
      }
    });

    // Document messages
    this.bot.on('document', async (msg) => {
      try {
        const fileId = msg.document.file_id;
        const file = await this.bot.getFile(fileId);
        const mediaUrl = await MediaService.uploadMediaToS3(file.file_path);

        await MessageService.storeAssistantMessage(msg.chat.id, [{
          type: 'document',
          url: mediaUrl,
          filename: msg.document.file_name
        }]);
      } catch (error) {
        console.error('Error handling document:', error);
      }
    });
  }

  async sendMessage(chatId, text, options = {}) {
    try {
      return await this.bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        ...options
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async sendPhoto(chatId, photo, options = {}) {
    try {
      return await this.bot.sendPhoto(chatId, photo, options);
    } catch (error) {
      console.error('Error sending photo:', error);
      throw error;
    }
  }

  async sendDocument(chatId, document, options = {}) {
    try {
      return await this.bot.sendDocument(chatId, document, options);
    } catch (error) {
      console.error('Error sending document:', error);
      throw error;
    }
  }

  async handlePollingError(error) {
    console.error('Polling error:', error.message);
    if (error.code === 'EFATAL' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 409) {
      await this.reconnectBot();
    }
  }

  async handleError(error) {
    console.error('Bot error:', error);
    if (error.code === 'ECONNRESET') {
      await this.reconnectBot();
    }
  }

  async reconnectBot() {
    console.log('Attempting to reconnect the bot...');
    try {
      await this.bot.stopPolling();
      await new Promise(resolve => setTimeout(resolve, RECONNECT_CONFIG.initialDelay));
      await this.bot.startPolling();
      console.log('Bot reconnected successfully.');
    } catch (error) {
      console.error('Failed to reconnect bot:', error);
      // Optionally implement retry logic or exit the process
    }
  }

  async start() {
    try {
      await this.bot.startPolling();
      console.log('Bot started successfully');
    } catch (error) {
      console.error('Failed to start bot:', error);
      throw error;
    }
  }

  async stop() {
    try {
      await this.bot.stopPolling();
      console.log('Bot stopped successfully');
    } catch (error) {
      console.error('Failed to stop bot:', error);
      throw error;
    }
  }
}

export const botService = new TelegramBotService();

// Function to delete the Telegram webhook
async function deleteWebhook() {
  const token = process.env.TELEGRAM_TOKEN;
  const url = `https://api.telegram.org/bot${token}/setWebhook`;
  try {
    const response = await axios.post(url, { url: "" });
    console.log('Webhook deleted:', response.data);
  } catch (error) {
    console.error('Error deleting webhook:', error);
  }
}

// Initialize the bot (This is now largely handled by the class)
export async function initialize() {
  try {
    await deleteWebhook(); // Added webhook deletion
    await botService.start();
    console.log('Bot initialization complete');

    // Add graceful shutdown handling
    process.on('SIGINT', async () => {
      console.log('Received SIGINT. Graceful shutdown...');
      await botService.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM. Graceful shutdown...');
      await botService.stop();
      process.exit(0);
    });

  } catch (err) {
    console.error('Initialization error:', err);
    if (botService.bot) {
      await botService.stop();
      console.log('Bot polling stopped due to error');
      setTimeout(initialize, 5000);
    }
  }
}

// Use dynamic import for modules that might use require (This is largely handled now)
// const loadDependencies = async () => { ... }