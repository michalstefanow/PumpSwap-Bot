# 🚀 PumpSwap SDK v2.0

**Advanced Solana DeFi Trading SDK with MEV Protection & Bundle Trading**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

A comprehensive TypeScript SDK for trading on PumpSwap (formerly PumpFun) with advanced features including MEV protection, bundle trading, and sophisticated pool management.

## ✨ Features

### 🛡️ **MEV Protection**
- **Nozomi Integration**: Protect transactions from MEV attacks
- **Bundle Trading**: Execute multiple transactions in the same block
- **Slippage Protection**: Configurable slippage tolerance

### 💰 **Advanced Trading**
- **Smart Pool Discovery**: Automatically find the best liquidity pools
- **Price Impact Calculation**: Real-time price impact analysis
- **Batch Operations**: Execute multiple trades efficiently
- **Percentage & Exact Amount Trading**: Flexible selling strategies

### 🔧 **Developer Experience**
- **TypeScript First**: Full type safety and IntelliSense support
- **Modular Architecture**: Clean separation of concerns
- **Comprehensive Logging**: Structured logging with Pino
- **Error Handling**: Robust error handling and recovery
- **CLI Tools**: Command-line interface for quick operations

### 📊 **Analytics & Monitoring**
- **Real-time Price Feeds**: Live price monitoring
- **Pool Analytics**: Detailed pool information and metrics
- **Transaction Tracking**: Monitor transaction status and confirmations
- **Balance Management**: Track SOL and token balances

## 🏗️ Architecture

```
src/
├── config/           # Configuration management
├── connection/       # Solana RPC connection handling
├── services/         # Business logic services
│   ├── pool.service.ts
│   ├── token.service.ts
│   └── transaction.service.ts
├── sdk/             # Main SDK classes
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── cli/             # Command-line interface
├── jito/            # Bundle trading integration
├── nozomi/          # MEV protection
└── IDL/             # Anchor program definitions
```

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/michalstefanow/PumpSwap-Bot
cd PumpSwap-Bot

# Install dependencies
npm install

# Build the project
npm run build
```

### Environment Setup

Create a `.env` file in the root directory:

```env
# Solana RPC Configuration
RPC_ENDPOINT=https://api.mainnet-beta.solana.com
RPC_WEBSOCKET_ENDPOINT=wss://api.mainnet-beta.solana.com
COMMITMENT_LEVEL=confirmed

# Wallet Configuration
PRIVATE_KEY=your_base58_encoded_private_key

# Logging
LOG_LEVEL=info

# MEV Protection
JITO_TIPS=1000
```

### Basic Usage

#### Programmatic API

```typescript
import { PumpSwapSDK } from './src/sdk/pumpswap.sdk';
import { PublicKey } from '@solana/web3.js';

async function main() {
  // Initialize SDK
  const sdk = new PumpSwapSDK();
  
  const tokenMint = new PublicKey('your_token_mint_address');
  const userWallet = new PublicKey('your_wallet_address');
  
  // Buy tokens
  const buyResult = await sdk.buy({
    mint: tokenMint,
    user: userWallet,
    solAmount: 0.5, // 0.5 SOL
    slippage: 500,  // 5% slippage tolerance
  });
  
  if (buyResult.success) {
    console.log(`Buy successful: ${buyResult.signature}`);
  }
  
  // Sell percentage of tokens
  const sellResult = await sdk.sellPercentage({
    mint: tokenMint,
    user: userWallet,
    percentage: 50, // Sell 50%
    slippage: 300,  // 3% slippage tolerance
  });
  
  // Get current price
  const price = await sdk.getPrice(tokenMint);
  console.log(`Current price: ${price} SOL per token`);
}
```

#### Command Line Interface

```bash
# Buy tokens
npm run buy -- buy --token <TOKEN_ADDRESS> --sol <SOL_AMOUNT> --slippage <SLIPPAGE>

# Sell percentage of tokens
npm run sell -- percentage --token <TOKEN_ADDRESS> --percentage <PERCENTAGE>

# Sell exact amount
npm run sell -- amount --token <TOKEN_ADDRESS> --amount <TOKEN_AMOUNT>

# Check price
npm run price -- --token <TOKEN_ADDRESS>

# Check pool info
npm run pool -- --token <TOKEN_ADDRESS>

# Check balance
npm run balance -- --token <TOKEN_ADDRESS>
```

## 📚 API Reference

### PumpSwapSDK

The main SDK class for interacting with PumpSwap.

#### Constructor
```typescript
new PumpSwapSDK(connection?: Connection)
```

#### Methods

##### `buy(params: BuyParams): Promise<TransactionResult>`
Buy tokens with SOL.

```typescript
interface BuyParams {
  mint: PublicKey;        // Token mint address
  user: PublicKey;        // User wallet address
  solAmount: number;      // Amount of SOL to spend
  slippage?: number;      // Slippage tolerance in basis points (default: 500)
}
```

##### `sellPercentage(params: SellParams): Promise<TransactionResult>`
Sell a percentage of tokens.

```typescript
interface SellParams {
  mint: PublicKey;        // Token mint address
  user: PublicKey;        // User wallet address
  percentage?: number;    // Percentage to sell (1-100, default: 100)
  slippage?: number;      // Slippage tolerance in basis points
}
```

##### `sellExactAmount(params: SellParams): Promise<TransactionResult>`
Sell an exact amount of tokens.

```typescript
interface SellParams {
  mint: PublicKey;        // Token mint address
  user: PublicKey;        // User wallet address
  exactAmount?: number;   // Exact amount of tokens to sell
  slippage?: number;      // Slippage tolerance in basis points
}
```

##### `getPrice(mint: PublicKey): Promise<number | null>`
Get the current price for a token.

##### `getPoolInfo(mint: PublicKey): Promise<PoolWithPrice | null>`
Get detailed pool information.

### Services

#### PoolService
Manages pool discovery and analytics.

```typescript
const poolService = new PoolService();

// Get best pool for trading
const bestPool = await poolService.getBestPool(tokenMint);

// Get all pools with prices
const pools = await poolService.getPoolsWithPrices(tokenMint);

// Get pool information
const poolInfo = await poolService.getPoolInfo(poolAddress);
```

#### TokenService
Handles token balance and account management.

```typescript
const tokenService = new TokenService();

// Get SOL balance
const solBalance = await tokenService.getSolBalance(wallet);

// Get token balance
const tokenBalance = await tokenService.getTokenBalance(mint, wallet);

// Get all token balances
const allBalances = await tokenService.getAllTokenBalances(wallet);
```

#### TransactionService
Manages transaction building and submission.

```typescript
const txService = new TransactionService();

// Send standard transaction
const result = await txService.sendTransaction(instructions, signer);

// Send with MEV protection
const result = await txService.sendNozomiTransaction(instructions, signer);

// Send as bundle
const result = await txService.sendBundleTransaction(instructions, signer);

// Simulate transaction
const simulation = await txService.simulateTransaction(instructions, signer);
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RPC_ENDPOINT` | Solana RPC endpoint | Required |
| `RPC_WEBSOCKET_ENDPOINT` | Solana WebSocket endpoint | Required |
| `COMMITMENT_LEVEL` | Transaction commitment level | `confirmed` |
| `PRIVATE_KEY` | Wallet private key (base58) | Required |
| `LOG_LEVEL` | Logging level | `info` |
| `JITO_TIPS` | Jito bundle tips | `1000` |

### Default Values

```typescript
const DEFAULTS = {
  DECIMALS: 6,
  SLIPPAGE: 500,           // 5% in basis points
  COMPUTE_UNITS: 70000,
  COMPUTE_UNIT_PRICE: 696969,
  LAMPORTS_PER_SOL: 1000000000,
};
```

## 🛠️ Development

### Scripts

```bash
# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Clean build artifacts
npm run clean
```

### Project Structure

- **`src/config/`**: Configuration management and constants
- **`src/connection/`**: Solana RPC connection handling
- **`src/services/`**: Business logic services (Pool, Token, Transaction)
- **`src/sdk/`**: Main SDK classes and interfaces
- **`src/types/`**: TypeScript type definitions
- **`src/utils/`**: Utility functions and helpers
- **`src/cli/`**: Command-line interface tools
- **`src/jito/`**: Bundle trading integration
- **`src/nozomi/`**: MEV protection integration

## 🔒 Security

- **Private Key Management**: Never commit private keys to version control
- **Environment Variables**: Use `.env` files for sensitive configuration
- **Input Validation**: All inputs are validated before processing
- **Error Handling**: Comprehensive error handling and logging
- **Transaction Simulation**: Simulate transactions before execution

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Solana Labs for the Solana blockchain
- Anchor team for the framework
- Jito Labs for bundle trading
- Nozomi for MEV protection

---

**⚠️ Disclaimer**: This software is for educational and development purposes. Use at your own risk. Always test with small amounts before using with significant funds.


