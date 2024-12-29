import { initialize as initializeTG } from './services/telegram/bot.js';
import { initialize as initializeGNON } from './services/gnon/bot.js';

import { ensureDirectories } from './setup.js';

async function startBot() {
    try {
        await ensureDirectories();
        await initializeTG();
        await initializeGNON();
    } catch (error) {
        console.error('Error starting bot:', error);
        process.exit(1);
    }
}

startBot();
