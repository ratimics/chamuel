import { ChamberService } from './chamberService.js';
import { BOT_MODEL, BOT_NAME } from './chamberService.js';
import { CONFIG } from '../../config/index.js';
import { setupMessageHandlers } from '../../utils/messageHandlers.js';

let chamberService;

export async function initialize() {
  try {
    // Initialize chamber service
    chamberService = new ChamberService(
      process.env.GNON_API_URL,
      process.env.GNON_API_KEY
    );

    // Verify connection
    await chamberService.verifyConnection();

    // Create default room if it doesn't exist
    await chamberService.createRoom({
      name: 'serpent-pit',
      model: BOT_MODEL,
      bot_name: BOT_NAME
    });

    // Setup message handling
    chamberService.subscribe('serpent-pit', async (messages) => {
      for (const message of messages) {
        await setupMessageHandlers(chamberService, message);
      }
    }, CONFIG.GNON.POLL_INTERVAL || 60000);

    console.log('GNON bot initialized successfully');
    
    // Graceful shutdown
    const cleanup = () => {
      console.log("[cleanup] Shutting down...");
      chamberService.cleanup();
      process.exit(0);
    };
    process.on("SIGINT", cleanup);

    return { chamberService, cleanup };

  } catch (error) {
    console.error('Failed to initialize GNON bot:', error);
    process.exit(1);
  }
}

export async function cleanup() {
  if (chamberService) {
    chamberService.cleanup();
  }
}