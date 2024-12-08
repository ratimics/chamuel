import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import OpenAI from 'openai';
import { APIClient } from 'openai/core.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate required environment variables
const REQUIRED_ENV = [
  'TELEGRAM_TOKEN',
  'OPENAI_API_URL',
  'OPENAI_API_KEY',
  'YOUR_SITE_NAME',
];

const missingEnvVars = REQUIRED_ENV.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

async function loadSystemPrompt() {
  try {
    const promptPath = path.join(__dirname, '../../assets/personality', 'system_prompt.md');
    return await fs.readFile(promptPath, 'utf-8');
  } catch (error) {
    console.error('Error loading system prompt:', error);
    return "You are Bob the Obsequious Snake."
  }
}


export const CONFIG = {
  PATHS: {
    ROOT: __dirname,
    PERSONALITY: path.join(__dirname, 'personality'),
    SUMMARIES: path.join(__dirname, 'summaries')
  },
  BOT: {
    RATE_LIMIT_MS: 10000,
    SUMMARY_THRESHOLD: 10,
    MAX_HISTORY_LENGTH: 20,
    MAX_SUMMARY_LENGTH: 500,
    MAX_DAILY_MESSAGES: 100,
    RECONNECT_ATTEMPTS: 5,
    INITIAL_RECONNECT_DELAY: 1000,
    MAX_RECONNECT_DELAY: 60000,
    MAX_CONSECUTIVE_ERRORS: 5,
    POLLING_INTERVAL: 30 * 1000
  },
  AI: {
    API_URL: process.env.OPENAI_API_URL,
    API_KEY: process.env.OPENAI_API_KEY,
    TEXT_MODEL: "nousresearch/hermes-3-llama-3.1-405b",
    TEXT_MODEL_SMALL: "meta-llama/llama-3.2-1b-instruct",
    VISION_MODEL: "meta-llama/llama-3.2-11b-vision-instruct",
    IMAGE_CACHE_SIZE: 1000, // Maximum number of cached image descriptions
    REQUEST_TIMEOUT: 30000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000
  },
  TOKENS: {
    TELEGRAM: process.env.TELEGRAM_TOKEN,
    OPENROUTER: process.env.OPENROUTER_API_KEY
  },
  SITE: {
    URL: process.env.YOUR_SITE_URL,
    NAME: process.env.YOUR_SITE_NAME
  },
};

// Initialize system prompt
export let SYSTEM_PROMPT;

export async function initializeConfig() {
  let config = { ...CONFIG };
  config.SYSTEM_PROMPT = await loadSystemPrompt();
  Object.freeze(config);
  SYSTEM_PROMPT = config.SYSTEM_PROMPT;
  return config;
}

const openai = new OpenAI({
  baseURL: process.env.OPENAI_API_URL,
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.YOUR_SITE_URL,
    "X-Title": process.env.YOUR_SITE_NAME,
  }
});

export { openai };

initializeConfig().catch(error => {
  console.error('Error initializing config:', error);
  process.exit(1);
});
