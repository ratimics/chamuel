export function setupBotErrorHandlers(bot) {
    bot.on('error', (error) => {
        console.error('Bot error:', error);
    });

    bot.on('polling_error', (error) => {
        console.error('Polling error:', error.message);
    });

    bot.on('webhook_error', (error) => {
        console.error('Webhook error:', error);
    });
}
