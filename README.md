# AAVE Fusion Supertransaction

MEE project showcasing fusion supertransactions with AAVE protocol.

## Quick Start

1. **Setup Environment**:

   ```bash
   npm run setup
   # Edit .env file with your Infura API key and Biconomy key
   ```

2. **Setup MEE Node**:

   ```bash
   npm run setup:mee
   ```

3. **Start Local Blockchain**:

   ```bash
   npm run start:anvil
   ```

4. **Start MEE Node**:

   ```bash
   npm run start:mee
   ```

5. **Initialize AbstractJS SDK**:

   ```bash
   npm run init:abstractjs
   ```

6. **Fund Test Account**:

   ```bash
   npm run fund:account
   ```

7. **Verify Setup**:

   ```bash
   npm run check:balance
   ```

8. **Execute Fusion Supertransaction**:

   ```bash
   npm run execute:fusion
   ```

## Prerequisites

- Node.js v18+
- Foundry (for Anvil, https://foundry.paradigm.xyz)
- Docker & Docker Compose
- Infura API key (or alternative RPC provider)

## License

MIT
