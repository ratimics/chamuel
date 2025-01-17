npm install
mkdir -p memories journals

# Create minimal .env for development
cat > .env << 'EOL'
TELEGRAM_TOKEN=dummy_token
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_API_KEY=dummy_key
YOUR_SITE_NAME=development
MONGODB_URI=mongodb://localhost:27017/dev
SOLANA_RPC_URL=https://api.devnet.solana.com
REPLICATE_API_TOKEN=dummy_token
EOL