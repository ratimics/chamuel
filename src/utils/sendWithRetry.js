/**
 * Simple helper to wait for a given number of milliseconds
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  
  /**
   * sendWithRetry
   * 
   * @param {Function} fn - The function you want to call, for example bot.sendMessage.bind(bot)
   * @param {Array} args - An array of arguments to pass to the above function
   * @param {Object} options - Config for retries
   * @param {number} options.retries - Number of times to retry (default: 3)
   * @param {number} options.minDelay - Initial delay in ms before retry (default: 1000)
   * @param {number} options.factor - Exponential backoff factor (default: 2)
   * @returns {Promise<any>} The result of the underlying function call
   */
  async function sendWithRetry(fn, args, { retries = 5, minDelay = 1000, factor = 2 } = {}) {
    let attempt = 0;
    let delay = minDelay;
  
    while (attempt < retries) {
      try {
        // Attempt the function call
        return await fn(...args);
      } catch (error) {
        attempt++;
  
        // If we've reached max retries, re-throw the error
        if (attempt >= retries) {
          throw error;
        }
  
        // If this is a Telegram "Too Many Requests" error (429), parse `retry_after`
        // (Error checking can vary based on your Telegram bot library)
        if (error.code === 'ETELEGRAM' && error.response && error.response.statusCode === 429) {
          const retryAfter = error.response.parameters?.retry_after || 5;
          console.warn(`Rate limit hit. Retrying after ${retryAfter} seconds...`);
          await sleep(retryAfter * 1000);
        } else {
          // For other types of errors, use exponential backoff
          console.warn(
            `Attempt ${attempt} failed. Retrying in ${delay}ms...`,
            error?.message || error
          );
          await sleep(delay);
          delay *= factor; // Increase delay for the next retry
        }
      }
    }
  }
  
  export { sendWithRetry };
  