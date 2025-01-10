
# Multi-Platform AI Bot System

A sophisticated AI bot system that integrates across Telegram, Discord, and X (Twitter) platforms, featuring advanced conversation capabilities, image generation, and blockchain-based memory archival.

## Core Features

### Advanced AI Models
- **Main Conversation**: `nousresearch/hermes-3-llama-3.1-405b`
- **Image Understanding**: `meta-llama/llama-3.2-11b-vision-instruct`  
- **Image Generation**: `black-forest-labs/flux-schnell`

### Memory Architecture
- **Short-term Memory**: MongoDB-based message storage
- **Long-term Memory**: Solana blockchain archival with NFT creation
- **Daily Summaries**: AI-generated conversation insights
- **Intelligent Context**: Maintains conversation history across platforms

### Media Generation
- Dynamic image creation based on context
- Meme generation capabilities
- Style-guided visual outputs
- Automatic optimization and processing

### Social Integration
- Cross-platform message handling
- Automated X (Twitter) posting
- Rate limit management
- Media sharing across platforms

### Blockchain Features
- Memory NFT creation
- Solana-based archival system
- Persistent storage of interactions
- Metaplex integration

## Technical Architecture

### Services Structure
```
src/
├── services/
│   ├── ai/         - AI model integrations
│   ├── memory/     - Memory management
│   ├── media/      - Media handling
│   ├── telegram/   - Telegram bot logic
│   ├── nft/        - NFT creation and tracking
│   └── x/          - X (Twitter) integration
```

### Database Schema
```javascript
// Message Schema
{
  chatId: String,
  userId: String,
  username: String,
  content: [{
    type: String,     // "text" | "image_description"
    text: String,
    nftMint?: String  // Optional NFT link
  }],
  timestamp: Date
}
```

## Setup Instructions

1. **Environment Setup**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `secrets.sample.json` to `.env`
   - Add required API keys:
     - Telegram Bot Token
     - OpenRouter API Key
     - Replicate API Token
     - MongoDB URI
     - Solana RPC URL

3. **Start the Bot**
   ```bash
   npm start
   ```

## Configuration

### Bot Personality
- Located in `assets/personality/`
- Modifiable system prompts
- Customizable style instructions

### Memory Settings
- Configurable retention periods
- Adjustable summarization frequency
- Customizable blockchain archival rules

## Maintenance

### Automated Tasks
- Daily memory summaries
- Weekly analytics generation
- Monthly performance reports

### Monitoring
- Real-time error tracking
- API usage monitoring
- Performance metrics
- Memory consumption analytics

## Development

### Adding Features
1. Create feature branch
2. Implement changes
3. Test thoroughly
4. Document changes
5. Submit for review

### Code Style
- ES Modules
- Async/await patterns
- Comprehensive error handling
- JSDoc documentation

## Testing

### Available Scripts
```bash
npm run test           # Run all tests
npm run test:unit      # Unit tests only
npm run test:int       # Integration tests
```

## Error Handling

### Circuit Breaker Implementation
```javascript
const circuitBreaker = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
  timeout: 5 * 60 * 1000,
  maxFailures: 10
};
```

### Retry Mechanism
```javascript
async function retry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
}
```

## License
MIT License - See LICENSE file for details

