#!/bin/bash

# MEE Node setup script

set -e  # Exit on any error

echo "Setting up MEE Node for local development..."

cd "$(dirname "$0")/../mee-node-deployment"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    print_error "jq is not installed. Please install jq first:"
    print_error "  macOS: brew install jq"
    print_error "  Ubuntu/Debian: sudo apt install jq"
    print_error "  Windows: choco install jq"
    exit 1
fi

if [ ! -f "../.env" ]; then
    print_error ".env file not found in parent directory. Please run 'npm run setup' first."
    exit 1
fi

if [ ! -f "docker-compose.yml.template" ]; then
    print_error "docker-compose.yml.template not found. Please ensure you're in the mee-node-deployment directory."
    exit 1
fi

source ../.env

if [ -z "$RPC_URL" ]; then
    print_error "RPC_URL not set in parent .env file. Please add your Infura API key."
    exit 1
fi

if [ -z "$TEST_PRIVATE_KEY" ]; then
    print_error "TEST_PRIVATE_KEY not set in parent .env file. Please add your test private key."
    exit 1
fi

if [ -z "$DOCKER_LOCAL_RPC_URL" ]; then
    print_error "DOCKER_LOCAL_RPC_URL not set in parent .env file. Please add your Docker local RPC URL."
    exit 1
fi

print_success "All prerequisites met."

# Create chains-local directory
print_status "Creating chains-local directory..."
mkdir -p chains-local


print_status "Creating Ethereum configuration for local fork..."
cp chains-prod/1.json chains-local/1.json

# Update the RPC URL to point to local network
jq ".rpc = \"${DOCKER_LOCAL_RPC_URL}\"" chains-local/1.json > chains-local/1.json.tmp && mv chains-local/1.json.tmp chains-local/1.json

print_success "Created Ethereum configuration (1.json) with local RPC URL"

print_status "Updating docker-compose.yml..."
# Use template file as source
cp docker-compose.yml.template docker-compose.yml
print_status "Created docker-compose.yml from template"

# Update the volumes section to use chains-local instead of chains-testnet
sed -i.bak 's|./chains-testnet:/usr/src/app/chains|./chains-local:/usr/src/app/chains|' docker-compose.yml
rm docker-compose.yml.bak

# Update environment variables to use environment variables
sed -i.bak "s|KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80|KEY=\${TEST_PRIVATE_KEY}|" docker-compose.yml
rm docker-compose.yml.bak

print_success "Updated docker-compose.yml"

print_status "Creating necessary directories..."
mkdir -p logs keystore redis-data

print_success "Created directories: logs, keystore, redis-data"

echo ""
echo "MEE Node setup completed successfully."
echo ""
echo "Created files:"
echo "   - chains-local/1.json (Ethereum config with local RPC URL)"
echo "   - docker-compose.yml (Updated for local setup)"
echo ""
echo "Next steps:"
echo "   1. Make sure Anvil is running: npm run start:anvil"
echo "   2. Start MEE node: npm run start:mee"
echo "   3. Verify setup: curl http://localhost:3000/v3/info"
echo ""
