# Telegram & Discord Bot Project

## Overview

A multi-platform AI bot system that combines social media engagement, content generation, and blockchain-based memory archival. The bot maintains conversations across Telegram, Discord, and X (Twitter), generates images, creates NFTs, and builds a persistent memory of its interactions.

## Core Features

### AI Conversation System
- **Models Used**:
  - `nousresearch/hermes-3-llama-3.1-405b` for main conversations
  - `meta-llama/llama-3.2-11b-vision-instruct` for image understanding
  - `black-forest-labs/flux-schnell` for image generation
  
- **Conversation Flow**:
  ```javascript
  async function handleText(chatId, openai, bot) {
    // Fetch recent chat history
    const history = await MessageService.fetchChatHistory(chatId);
    
    // Generate AI response
    const response = await openai.chat.completions.create({
      model: CONFIG.AI.TEXT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: combinedMessages }
      ],
      temperature: 0.8
    });
    
    return response;
  }
  ```

### Memory System

#### Short-term Memory
- Stores recent conversations in MongoDB
- Maintains context for ongoing discussions
- Example schema:
  ```javascript
  {
    chatId: String,
    userId: String,
    username: String,
    content: [{
      type: String,  // "text" | "image_description"
      text: String
    }],
    timestamp: Date
  }
  ```

#### Long-term Memory
- Generates daily summaries using AI
- Archives memories to Solana blockchain
- Creates memory NFTs
- Example memory generation:
  ```javascript
  async function summarizeMemory(previousMemory, recentMessages) {
    const response = await openai.chat.completions.create({
      model: CONFIG.AI.TEXT_MODEL,
      messages: [
        { role: "system", content: MEMORY_SUMMARY_PROMPT },
        { role: "assistant", content: `Previous: ${previousMemory}` },
        { role: "user", content: `New: ${recentMessages}` }
      ]
    });
    return response.choices[0].message.content;
  }
  ```

### Image Generation System

#### Generation Process
1. **Prompt Creation**:
   ```javascript
   const imagePrompt = await getLLMPrompt(combinedMessages);
   const stylePrompt = await MediaService.getStylePrompt();
   const fullPrompt = `${imagePrompt}\n\n${stylePrompt}`;
   ```

2. **Image Generation**:
   ```javascript
   const image = await generateImage(fullPrompt, CONFIG.AI.CUSTOM_IMAGE_MODEL);
   ```

3. **Processing & Optimization**:
   ```javascript
   async function processImage(buffer, type) {
     if (buffer.length > 5242880) {  // 5MB
       const metadata = await sharp(buffer).metadata();
       return await sharp(buffer)
         .resize(Math.floor(metadata.width * 0.8))
         .toBuffer();
     }
     return buffer;
   }
   ```

### Social Media Integration

#### X (Twitter) Integration
- Auto-posts generated content
- Captures and analyzes mentions
- Rate limit handling:
  ```javascript
  async function postX(params, imageBuffer) {
    if (Date.now() < rateLimitReset) {
      console.log(`Rate limited, retry after ${rateLimitReset}`);
      return null;
    }
    
    try {
      const mediaId = await uploadImageBuffer(imageBuffer);
      const response = await xClient.v2.tweet({
        text: params.text,
        media: { media_ids: [mediaId] }
      });
      return response;
    } catch (error) {
      handleXError(error);
    }
  }
  ```

### Web Dashboard

#### Real-time Monitoring
- Socket.IO for live updates
- Message feed display
- Statistics tracking

```javascript
// Dashboard setup
const app = express();
const server = createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
  socket.on('requestStats', async () => {
    const stats = await getSystemStats();
    socket.emit('stats', stats);
  });
});
```

## Installation & Setup

### Detailed Setup Steps

1. **Clone and Install**:
   ```bash
   git clone https://github.com/your-username/telegram-bob.git
   cd telegram-bot
   npm install
   ```

2. **Configure MongoDB**:
   ```bash
   # Start MongoDB
   mongod --dbpath /path/to/data
   
   # Create indexes
   db.messages.createIndex({ chatId: 1, timestamp: -1 })
   db.memory.createIndex({ date: 1 })
   ```

3. **Configure Solana**:
   ```bash
   # Generate new wallet for development
   solana-keygen new --outfile .dev-wallet.json
   ```

4. **Set Environment Variables**:
   ```bash
   # Development
   cp .env.example .env.development
   
   # Production
   cp .env.example .env.production
   ```

### Required API Keys

#### Telegram Bot Setup
1. Message @BotFather on Telegram
2. Create new bot: `/newbot`
3. Configure bot settings:
   ```
   /setprivacy - Disable
   /setinline - Enable
   /setjoingroups - Enable
   ```

#### OpenRouter Setup
1. Create account at openrouter.ai
2. Generate API key
3. Set rate limits and model access

#### Replicate Setup
1. Create account
2. Generate API token
3. Configure model access

## Error Handling

### Circuit Breaker Pattern
```javascript
const circuitBreaker = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
  timeout: 5 * 60 * 1000,
  maxFailures: 10
};

function isCircuitOpen() {
  if (!circuitBreaker.isOpen) return false;
  if (Date.now() - circuitBreaker.lastFailure > circuitBreaker.timeout) {
    resetCircuitBreaker();
    return false;
  }
  return true;
}
```

### Retry Mechanism
```javascript
async function retry(fn, maxRetries = 3, backoff = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const delay = backoff * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
```

## Maintenance

### Daily Tasks
- Monitor error logs
- Check API usage
- Verify memory archival
- Update style prompts

### Weekly Tasks
- Review system performance
- Analyze conversation quality
- Backup database
- Clean old files

### Monthly Tasks
- Update dependencies
- Review API costs
- Optimize database indexes
- Update documentation

## Development Workflow

### Adding New Features
1. Create feature branch
2. Implement changes
3. Add tests
4. Update documentation
5. Create pull request

### Code Style
- Use ES modules
- Async/await for promises
- Comprehensive error handling
- Clear comments
- TypeScript-style JSDoc

## Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### Load Testing
```bash
npm run test:load
```

## Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Build
npm run build

# Start
npm start

# Monitor
pm2 start ecosystem.config.js
```

### Docker
```bash
# Build
docker build -t telegram-bot .

# Run
docker run -d --env-file .env telegram-bot
```

## Monitoring & Logging

### Logging System
- Winston for structured logging
- Log rotation
- Error tracking
- Performance monitoring

### Metrics
- Response times
- API usage
- Memory consumption
- Database performance

## Support & Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check API keys
   - Verify network connection
   - Review rate limits

2. **Memory Issues**
   - Check MongoDB connection
   - Verify Solana wallet balance
   - Review memory generation logs

3. **Image Generation Issues**
   - Check Replicate API status
   - Verify model availability
   - Review prompt formatting

### Getting Help
- Create GitHub issue
- Join Discord community
- Check documentation
- Review error logs

## Future Plans

### Planned Features
- Voice message support
- Multi-language support
- Advanced analytics
- Community features

### Roadmap
1. Q1: Enhanced memory system
2. Q2: Advanced image generation
3. Q3: Community features
4. Q4: Analytics dashboard

## License

MIT License (or your chosen license)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.
