#!/usr/bin/env ts-node

import { Command } from 'commander';
import { PublicKey } from '@solana/web3.js';
import { PumpSwapSDK } from '../sdk/pumpswap.sdk';
import { connection, wallet } from '../connection';
import { logger } from '../utils/logger';

const program = new Command();

program
  .name('sell-cli')
  .description('Sell tokens on PumpSwap')
  .version('1.0.0');

program
  .command('percentage')
  .description('Sell percentage of tokens')
  .requiredOption('--token <address>', 'Token mint address')
  .requiredOption('--percentage <amount>', 'Percentage to sell (1-100)')
  .option('--slippage <percentage>', 'Slippage tolerance in basis points (default: 500)', '500')
  .action(async (options) => {
    try {
      const { token, percentage, slippage } = options;
      
      // Validate inputs
      if (!PublicKey.isOnCurve(new PublicKey(token))) {
        throw new Error('Invalid token address');
      }
      
      const percentageAmount = parseFloat(percentage);
      if (isNaN(percentageAmount) || percentageAmount <= 0 || percentageAmount > 100) {
        throw new Error('Invalid percentage (must be 1-100)');
      }
      
      const slippageBps = parseInt(slippage);
      if (isNaN(slippageBps) || slippageBps < 0 || slippageBps > 10000) {
        throw new Error('Invalid slippage (must be 0-10000 basis points)');
      }

      logger.info(`Starting sell transaction for ${percentageAmount}% of ${token}`);

      // Initialize SDK
      const sdk = new PumpSwapSDK(connection);
      
      // Execute sell
      const result = await sdk.sellPercentage({
        mint: new PublicKey(token),
        user: wallet.publicKey,
        percentage: percentageAmount,
        slippage: slippageBps,
      });

      if (result.success) {
        logger.info(`✅ Sell transaction successful!`);
        logger.info(`Transaction signature: ${result.signature}`);
        console.log(`\n🎉 Successfully sold ${percentageAmount}% of tokens!`);
        console.log(`Transaction: https://solscan.io/tx/${result.signature}`);
      } else {
        logger.error(`❌ Sell transaction failed: ${result.error}`);
        console.log(`\n❌ Transaction failed: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      logger.error('Error in sell command:', error);
      console.log(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('amount')
  .description('Sell exact amount of tokens')
  .requiredOption('--token <address>', 'Token mint address')
  .requiredOption('--amount <number>', 'Exact amount of tokens to sell')
  .option('--slippage <percentage>', 'Slippage tolerance in basis points (default: 500)', '500')
  .action(async (options) => {
    try {
      const { token, amount, slippage } = options;
      
      // Validate inputs
      if (!PublicKey.isOnCurve(new PublicKey(token))) {
        throw new Error('Invalid token address');
      }
      
      const tokenAmount = parseFloat(amount);
      if (isNaN(tokenAmount) || tokenAmount <= 0) {
        throw new Error('Invalid token amount');
      }
      
      const slippageBps = parseInt(slippage);
      if (isNaN(slippageBps) || slippageBps < 0 || slippageBps > 10000) {
        throw new Error('Invalid slippage (must be 0-10000 basis points)');
      }

      logger.info(`Starting sell transaction for ${tokenAmount} tokens of ${token}`);

      // Initialize SDK
      const sdk = new PumpSwapSDK(connection);
      
      // Execute sell
      const result = await sdk.sellExactAmount({
        mint: new PublicKey(token),
        user: wallet.publicKey,
        exactAmount: tokenAmount,
        slippage: slippageBps,
      });

      if (result.success) {
        logger.info(`✅ Sell transaction successful!`);
        logger.info(`Transaction signature: ${result.signature}`);
        console.log(`\n🎉 Successfully sold ${tokenAmount} tokens!`);
        console.log(`Transaction: https://solscan.io/tx/${result.signature}`);
      } else {
        logger.error(`❌ Sell transaction failed: ${result.error}`);
        console.log(`\n❌ Transaction failed: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      logger.error('Error in sell command:', error);
      console.log(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('balance')
  .description('Check token balance')
  .requiredOption('--token <address>', 'Token mint address')
  .action(async (options) => {
    try {
      const { token } = options;
      
      if (!PublicKey.isOnCurve(new PublicKey(token))) {
        throw new Error('Invalid token address');
      }

      logger.info(`Checking balance for token ${token}`);

      const sdk = new PumpSwapSDK(connection);
      const balance = await sdk.getTokenBalance(new PublicKey(token), wallet.publicKey);

      console.log(`\n💰 Token Balance:`);
      console.log(`Token: ${token}`);
      console.log(`Balance: ${balance} tokens`);
      console.log(`Wallet: ${wallet.publicKey.toBase58()}`);
    } catch (error) {
      logger.error('Error checking balance:', error);
      console.log(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

// Parse command line arguments
if (require.main === module) {
  program.parse();
} 