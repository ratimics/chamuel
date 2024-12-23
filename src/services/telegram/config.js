// ----------------------------------------------------
// region: config.js
// ----------------------------------------------------

// Example of a global configuration object
export const CONFIG = {
    AI: {
      TEXT_MODEL_SMALL: 'nousresearch/hermes-3-llama-3.1-70b',
      TEXT_MODEL: 'nousresearch/hermes-3-llama-3.1-405b',
      CUSTOM_IMAGE_MODEL: 'immanencer/mirquo' || process.env['AI_CUSTOM_IMAGE_MODEL'],
      STYLE_PROMPT_FILE: './assets/personality/stylePrompt.txt'
    },
    IMAGE_INTERVAL: 60 * 60 * 1000,    // 1 hour
    XPOST_INTERVAL: 2 * 60 * 60 * 1000, // 2 hours
    X_POST_CHANCE: 1.0
  };
  
  // Add any other global configs, e.g. for DB, environment, etc.
  // This central config can be imported by all other services
  // so you can manage or display them in a future dashboard.
  