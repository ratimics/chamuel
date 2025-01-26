
import { initialize as initializeTG } from "./services/telegram/bot.js";
import { initialize as initializeGNON } from "./services/gnon/bot.js";
import { XService } from "./services/x/xService.js";
import { ensureDirectories } from "./setup.js";

async function startBot() {
  try {
    await ensureDirectories();
    
    // Initialize all services
    await Promise.all([
      initializeTG(),
      initializeGNON(),
      XService.initialize()
    ]);

    // Post startup message to X
    try {
      await XService.post({
        text: "🤖✨ Bot systems online and ready to serve! #AI #Assistant"
      });
    } catch (error) {
      console.warn('Failed to post startup message:', error);
    }

    console.log('All systems initialized successfully');
    
  } catch (error) {
    console.error("Error starting bot:", error);
    process.exit(1);
  }
}

startBot();
