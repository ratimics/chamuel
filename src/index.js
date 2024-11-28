import { initialize } from './services/telegram/bot.js';

async function startBot() {
  try {
    // Initialize configuration and load system prompt
    await initialize();
    
  } catch (error) {
    console.error('Error starting bot:', error);
    process.exit(1);
  }
}

startBot();
