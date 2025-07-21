#!/usr/bin/env ts-node

import { PumpSwapSDK, PublicKey, logger } from '../src';

/**
 * Basic usage example for PumpSwap SDK v2.0
 * 
 * This example demonstrates:
 * - SDK initialization
 * - Buying tokens
 * - Selling tokens
 * - Price checking
 * - Pool information retrieval
 */

async function main() {
  try {
    logger.info('🚀 Starting PumpSwap SDK v2.0 Example');

    // Initialize the SDK
    const sdk = new PumpSwapSDK();
    
    // Example token mint (replace with actual token address)
    const tokenMint = new PublicKey('11111111111111111111111111111111'); // Placeholder
    const userWallet = new PublicKey('11111111111111111111111111111111'); // Placeholder

    logger.info(`📊 Checking price for token: ${tokenMint.toBase58()}`);

    // Get current price
    const price = await sdk.getPrice(tokenMint);
    if (price !== null) {
      logger.info(`💰 Current price: ${price} SOL per token`);
    } else {
      logger.warn('⚠️ No price data available for this token');
    }

    // Get pool information
    const poolInfo = await sdk.getPoolInfo(tokenMint);
    if (poolInfo) {
      logger.info(`🏊 Pool found: ${poolInfo.address.toBase58()}`);
      logger.info(`📈 Pool price: ${poolInfo.price} SOL per token`);
      logger.info(`💧 Native reserve: ${poolInfo.reserves.native} SOL`);
      logger.info(`🪙 Token reserve: ${poolInfo.reserves.token} tokens`);
    } else {
      logger.warn('⚠️ No pool found for this token');
    }

    // Example buy transaction (commented out for safety)
    /*
    logger.info('🛒 Executing buy transaction...');
    const buyResult = await sdk.buy({
      mint: tokenMint,
      user: userWallet,
      solAmount: 0.1, // 0.1 SOL
      slippage: 500,  // 5% slippage tolerance
    });

    if (buyResult.success) {
      logger.info(`✅ Buy successful! Transaction: ${buyResult.signature}`);
    } else {
      logger.error(`❌ Buy failed: ${buyResult.error}`);
    }
    */

    // Example sell transaction (commented out for safety)
    /*
    logger.info('💰 Executing sell transaction...');
    const sellResult = await sdk.sellPercentage({
      mint: tokenMint,
      user: userWallet,
      percentage: 50, // Sell 50%
      slippage: 300,  // 3% slippage tolerance
    });

    if (sellResult.success) {
      logger.info(`✅ Sell successful! Transaction: ${sellResult.signature}`);
    } else {
      logger.error(`❌ Sell failed: ${sellResult.error}`);
    }
    */

    logger.info('✅ Example completed successfully!');

  } catch (error) {
    logger.error('❌ Example failed:', error);
    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main }; 