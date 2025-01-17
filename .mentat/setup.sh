# Install npm dependencies
npm install

# Create required directories
mkdir -p ./memories ./journals

# Copy environment file template and warn about configuration
if [ ! -f .env ]; then
    echo "WARNING: You need to configure your .env file with required API keys and credentials"
fi