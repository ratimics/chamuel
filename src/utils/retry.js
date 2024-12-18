
const DEFAULT_RETRIES = 3;
const INITIAL_BACKOFF = 1000;

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} backoff - Initial backoff in milliseconds
 * @returns {Promise<any>} - Result of the function
 */
export async function retry(fn, maxRetries = DEFAULT_RETRIES, backoff = INITIAL_BACKOFF) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            console.warn(`Attempt ${i + 1} failed:`, error.message);
            
            if (i < maxRetries - 1) {
                const delay = backoff * Math.pow(2, i);
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
}