// ----------------------------------------------------
// region: config.js
// ----------------------------------------------------

// Example of a global configuration object
export const CONFIG = {
    AI: {
      TEXT_MODEL_SMALL: 'gpt-3.5-turbo',
      TEXT_MODEL: 'gpt-4',
      CUSTOM_IMAGE_MODEL: 'my-custom-image-model',
      STYLE_PROMPT_FILE: './assets/personality/stylePrompt.txt'
    },
    IMAGE_INTERVAL: 60 * 60 * 1000,    // 1 hour
    XPOST_INTERVAL: 2 * 60 * 60 * 1000, // 2 hours
    X_POST_CHANCE: 1.0
  };
  
  // Add any other global configs, e.g. for DB, environment, etc.
  // This central config can be imported by all other services
  // so you can manage or display them in a future dashboard.
  