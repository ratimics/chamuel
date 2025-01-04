import { initialize as initializeTG } from "./services/telegram/bot.js";
import { initialize as initializeGNON } from "./services/gnon/bot.js";

import { ensureDirectories } from "./setup.js";

import { handleThink } from "./services/gnon/actions/handlers.js";

async function startBot() {
    try {
        await ensureDirectories();
        await mongoDBService.connect();
        
        // Post startup message via think action
        await handleThink("startup", "Greetings! I am Chamuel, your nerdy angel assistant, and I'm now online! 🤓✨ Ready to help with computational and spiritual matters alike! #AI #Assistant");
        
        initializeTG();
        initializeGNON();
    } catch (error) {
        console.error("Error starting bot:", error);
        process.exit(1);
    }
}

startBot();
