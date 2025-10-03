#!/bin/bash

# Start Anvil with mainnet fork
# This script assumes you have Foundry installed and your RPC_URL set in .env

if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
else
    echo ".env file not found. Please run 'npm run setup' first."
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo "RPC_URL not set in .env file. Please add your Infura API key."
    exit 1
fi

echo "Starting Anvil with mainnet fork..."
echo "RPC URL: $RPC_URL"
echo "Local RPC: http://localhost:8545"
echo ""

anvil \
  --fork-url "$RPC_URL" \
  --port 8545 \
  --host 0.0.0.0 \
  --chain-id 1 \
  --gas-limit 30000000 \
  --gas-price 20000000000 \
  --accounts 10 \
  --balance 10000 \
  --mnemonic "test test test test test test test test test test test junk"
