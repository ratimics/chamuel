import { initialize as initializeTG } from "./services/telegram/bot.js";
import { initialize as initializeGNON } from "./services/gnon/bot.js";

import { ensureDirectories } from "./setup.js";
import { postX } from "./services/x/x.js";

import { handleThink } from "./services/gnon/actions/handlers.js";

async function startBot() {
    try {
        await ensureDirectories();
        await mongoDBService.connect();
        
        // Initialize services
        await initializeTG();
        await initializeGNON();
        
        // Post startup message to X
        const startupMessage = "Greetings! I am Chamuel, your nerdy angel assistant, and I'm now online! 🤓✨ Ready to help with computational and spiritual matters alike! #AI #Assistant";
        
        try {
            const tweetResult = await postX({ text: startupMessage });
            if (tweetResult?.id) {
                console.log('Successfully posted startup message to X:', tweetResult.id);
            } else {
                console.error('Failed to post startup message to X');
            }
        } catch (error) {
            console.error('Error posting startup message to X:', error);
        }
        
    } catch (error) {
        console.error("Error starting bot:", error);
        process.exit(1);
    }
}

startBot();
