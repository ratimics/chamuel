import { initialize } from './services/gnon/chamberBot.js';
import { ensureDirectories } from './setup.js';

async function startBot() {
    try {
        await ensureDirectories();
        await initialize();
    } catch (error) {
        console.error('Error starting bot:', error);
        process.exit(1);
    }
}

startBot();
