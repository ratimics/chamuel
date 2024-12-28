const fs = require('fs');
const path = require('path');

function envToJson(envPath = '.env') {
  try {
    // Read the .env file
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Initialize result object
    const result = {};
    
    // Split into lines and process each line
    const lines = envContent.split('\n');
    
    for (let line of lines) {
      // Skip empty lines and comments
      line = line.trim();
      if (!line || line.startsWith('#')) continue;
      
      // Split on first = only
      const splitIndex = line.indexOf('=');
      if (splitIndex === -1) continue;
      
      const key = line.slice(0, splitIndex).trim();
      let value = line.slice(splitIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      result[key] = value;
    }
    
    // Convert to formatted JSON string
    return JSON.stringify(result, null, 2);
    
  } catch (error) {
    console.error('Error processing .env file:', error.message);
    process.exit(1);
  }
}

// Get file path from command line args or use default
const envPath = process.argv[2] || '.env';

// Run the conversion
const jsonOutput = envToJson(envPath);
console.log(jsonOutput);