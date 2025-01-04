
import { initialize as initializeTG } from "./src/services/telegram/bot.js";
import { initialize as initializeGNON } from "./src/services/gnon/bot.js";
import { ensureDirectories } from "./src/setup.js";
import "./src/server/index.js";

async function startBot() {
  try {
    // Ensure required directories exist
    await ensureDirectories();
    
    // Initialize Telegram bot
    await initializeTG();
    
    // Initialize GNON bot
    await initializeGNON();
    
    console.log('Bot systems initialized successfully');
  } catch (error) {
    console.error("Error starting bot:", error);
    process.exit(1);
  }
}

startBot();
