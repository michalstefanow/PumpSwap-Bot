#!/usr/bin/env ts-node

import { Command } from 'commander';
import { PublicKey } from '@solana/web3.js';
import { PumpSwapSDK } from '../sdk/pumpswap.sdk';
import { connection, wallet } from '../connection';
import { logger } from '../utils/logger';

const program = new Command();

program
  .name('buy-cli')
  .description('Buy tokens on PumpSwap')
  .version('1.0.0');

program
  .command('buy')
  .description('Buy tokens with SOL')
  .requiredOption('--token <address>', 'Token mint address')
  .requiredOption('--sol <amount>', 'Amount of SOL to spend')
  .option('--slippage <percentage>', 'Slippage tolerance in basis points (default: 500)', '500')
  .action(async (options) => {
    try {
      const { token, sol, slippage } = options;
      
      // Validate inputs
      if (!PublicKey.isOnCurve(new PublicKey(token))) {
        throw new Error('Invalid token address');
      }
      
      const solAmount = parseFloat(sol);
      if (isNaN(solAmount) || solAmount <= 0) {
        throw new Error('Invalid SOL amount');
      }
      
      const slippageBps = parseInt(slippage);
      if (isNaN(slippageBps) || slippageBps < 0 || slippageBps > 10000) {
        throw new Error('Invalid slippage (must be 0-10000 basis points)');
      }

      logger.info(`Starting buy transaction for ${token} with ${solAmount} SOL`);

      // Initialize SDK
      const sdk = new PumpSwapSDK(connection);
      
      // Execute buy
      const result = await sdk.buy({
        mint: new PublicKey(token),
        user: wallet.publicKey,
        solAmount,
        slippage: slippageBps,
      });

      if (result.success) {
        logger.info(`✅ Buy transaction successful!`);
        logger.info(`Transaction signature: ${result.signature}`);
        console.log(`\n🎉 Successfully bought tokens!`);
        console.log(`Transaction: https://solscan.io/tx/${result.signature}`);
      } else {
        logger.error(`❌ Buy transaction failed: ${result.error}`);
        console.log(`\n❌ Transaction failed: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      logger.error('Error in buy command:', error);
      console.log(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('price')
  .description('Get current price for a token')
  .requiredOption('--token <address>', 'Token mint address')
  .action(async (options) => {
    try {
      const { token } = options;
      
      if (!PublicKey.isOnCurve(new PublicKey(token))) {
        throw new Error('Invalid token address');
      }

      logger.info(`Getting price for token ${token}`);

      const sdk = new PumpSwapSDK(connection);
      const price = await sdk.getPrice(new PublicKey(token));

      if (price !== null) {
        console.log(`\n💰 Current price: ${price} SOL per token`);
      } else {
        console.log(`\n❌ No price data available for this token`);
      }
    } catch (error) {
      logger.error('Error getting price:', error);
      console.log(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('pool')
  .description('Get pool information for a token')
  .requiredOption('--token <address>', 'Token mint address')
  .action(async (options) => {
    try {
      const { token } = options;
      
      if (!PublicKey.isOnCurve(new PublicKey(token))) {
        throw new Error('Invalid token address');
      }

      logger.info(`Getting pool info for token ${token}`);

      const sdk = new PumpSwapSDK(connection);
      const pool = await sdk.getPoolInfo(new PublicKey(token));

      if (pool) {
        console.log(`\n🏊 Pool Information:`);
        console.log(`Pool Address: ${pool.address.toBase58()}`);
        console.log(`Price: ${pool.price} SOL per token`);
        console.log(`Native Reserve: ${pool.reserves.native} SOL`);
        console.log(`Token Reserve: ${pool.reserves.token} tokens`);
      } else {
        console.log(`\n❌ No pool found for this token`);
      }
    } catch (error) {
      logger.error('Error getting pool info:', error);
      console.log(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

// Parse command line arguments
if (require.main === module) {
  program.parse();
} 