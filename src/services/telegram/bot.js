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

// Bot state management
const state = {
  chatHistories: {},
  lastResponseTimes: {},
  messageQueues: {},
  processedMessages: new Set(),
};

// Telegram Bot initialization
let bot;
function initBot() {
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

  const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, options);
  
  bot.on('polling_error', async (error) => {
    console.error('Polling error:', error.message);
    if (error.code === 'EFATAL' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 409) { // Added 409
      if (error.code === 409) {
        console.warn('Conflict error encountered. Retrying with exponential backoff...');
        await handleConflictError(bot);
      } else {
        await reconnectBot(bot);
      }
    }
  });

  bot.on('error', async (error) => {
    console.error('Bot error:', error);
    if (error.code === 'ECONNRESET') {
      await reconnectBot(bot);
    }
  });

  return bot;
}

// Add conflict error handling with exponential backoff
async function handleConflictError(bot) {
  let attempt = 0;
  let delay = 1000; // Start with 1 second

  while (attempt < RECONNECT_CONFIG.maxAttempts) {
    try {
      console.log(`Conflict retry attempt ${attempt + 1}...`);
      await bot.stopPolling();
      await new Promise(resolve => setTimeout(resolve, delay));
      await bot.startPolling();
      console.log('Successfully recovered from conflict error');
      return;
    } catch (error) {
      console.error(`Conflict retry attempt ${attempt + 1} failed:`, error);
      attempt++;
      delay = Math.min(delay * 2, RECONNECT_CONFIG.maxDelay);
    }
  }
  
  console.error('Max conflict retry attempts reached. Restarting process...');
  process.exit(1); // Process manager should restart the application
}

// Define the missing reconnectBot function to handle bot reconnection
async function reconnectBot(bot) {
  console.log('Attempting to reconnect the bot...');
  try {
    await bot.stopPolling();
    await new Promise(resolve => setTimeout(resolve, RECONNECT_CONFIG.initialDelay || 1000));
    await bot.startPolling();
    console.log('Bot reconnected successfully.');
  } catch (error) {
    console.error('Failed to reconnect bot:', error);
    // Optionally implement retry logic or exit the process
  }
}

// Use dynamic import for modules that might use require
const loadDependencies = async () => {
  try {
    // Setup error handlers
    const { setupBotErrorHandlers } = await import('../../utils/errorHandlers.js');
    // Setup message handlers
    const { setupMessageHandlers, stopMessageProcessing } = await import('../../utils/messageHandlers.js');
    
    return {
      setupBotErrorHandlers,
      setupMessageHandlers,
      stopMessageProcessing
    };
  } catch (error) {
    console.error('Error loading dependencies:', error);
    throw error;
  }
};

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

// Initialize the bot
export async function initialize() {
  try {
    
    await deleteWebhook(); // Added webhook deletion

    const handlers = await loadDependencies();
    bot = initBot();
  

    handlers.setupBotErrorHandlers(bot);
    await setupMessageHandlers(bot, openai); // Adjusted to directly use setupMessageHandlers
    await bot.startPolling(); // Manually start polling
    console.log('Bot initialization complete');

    // Add graceful shutdown handling
    process.on('SIGINT', async () => {
      console.log('Received SIGINT. Graceful shutdown...');
      await bot.stopPolling();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM. Graceful shutdown...');
      await bot.stopPolling();
      process.exit(0);
    });

  } catch (err) {
    console.error('Initialization error:', err);
    if (bot) {
      await bot.stopPolling();
      console.log('Bot polling stopped due to error');
      setTimeout(initialize, 5000);
    }
  }
}


