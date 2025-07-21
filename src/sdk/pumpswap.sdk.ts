import {
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
} from '@solana/spl-token';
import { PumpSwap, IDL } from '../IDL';
import { connection, wallet } from '../connection';
import { sendNozomiTx } from '../nozomi/tx-submission';
import { sendBundle } from '../jito';
import { PoolService } from '../services/pool.service';
import { TokenService } from '../services/token.service';
import { TransactionService } from '../services/transaction.service';
import {
  PROGRAM_IDS,
  PUMPSWAP_ADDRESSES,
  INSTRUCTION_DISCRIMINATORS,
  DEFAULTS,
} from '../config';
import { BuyParams, SellParams, TransactionResult } from '../types';
import { logger } from '../utils/logger';

export class PumpSwapSDK {
  private program: Program<PumpSwap>;
  private connection: Connection;
  private poolService: PoolService;
  private tokenService: TokenService;
  private transactionService: TransactionService;

  constructor(connectionInstance: Connection = connection) {
    this.connection = connectionInstance;
    this.program = new Program(IDL, { connection: this.connection });
    this.poolService = new PoolService(this.connection);
    this.tokenService = new TokenService(this.connection);
    this.transactionService = new TransactionService(this.connection);
  }

  /**
   * Buy tokens with SOL
   */
  async buy(params: BuyParams): Promise<TransactionResult> {
    try {
      const { mint, user, solAmount, slippage = DEFAULTS.SLIPPAGE } = params;

      logger.info(`Starting buy transaction for ${mint.toBase58()} with ${solAmount} SOL`);

      // Get the best pool for trading
      const pool = await this.poolService.getBestPool(mint);
      if (!pool) {
        throw new Error(`No pool found for token ${mint.toBase58()}`);
      }

      // Calculate token amount to receive
      const boughtTokenAmount = await this.calculateBuyTokenAmount(
        BigInt(solAmount * LAMPORTS_PER_SOL),
        mint
      );

      // Apply slippage tolerance
      const amountAfterSlippage = this.calculateWithSlippageBuy(boughtTokenAmount, BigInt(slippage));

      logger.info({
        status: `Found pool for ${mint.toBase58()}`,
        poolAddress: pool.address.toBase58(),
        expectedTokens: Number(amountAfterSlippage),
        slippage: slippage / 100, // Convert basis points to percentage
      });

      // Create buy instruction
      const buyInstruction = await this.createBuyInstruction(
        pool.address,
        user,
        mint,
        amountAfterSlippage,
        BigInt(solAmount * LAMPORTS_PER_SOL)
      );

      // Create associated token account instruction
      const ata = getAssociatedTokenAddressSync(mint, user);
      const createAtaInstruction = createAssociatedTokenAccountIdempotentInstruction(
        wallet.publicKey,
        ata,
        wallet.publicKey,
        mint
      );

      // Build transaction
      const instructions = [
        ComputeBudgetProgram.setComputeUnitLimit({
          units: DEFAULTS.COMPUTE_UNITS,
        }),
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: DEFAULTS.COMPUTE_UNIT_PRICE,
        }),
        createAtaInstruction,
        buyInstruction,
      ];

      // Send transaction
      const result = await this.transactionService.sendTransaction(
        instructions,
        wallet,
        'PumpSwap Buy'
      );

      if (result.success) {
        logger.info(`Buy transaction successful: ${result.signature}`);
      } else {
        logger.error(`Buy transaction failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      logger.error('Error in buy transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sell exact amount of tokens
   */
  async sellExactAmount(params: SellParams): Promise<TransactionResult> {
    try {
      const { mint, user, exactAmount, slippage = DEFAULTS.SLIPPAGE } = params;

      if (!exactAmount) {
        throw new Error('Exact amount is required for sellExactAmount');
      }

      logger.info(`Starting sell transaction for ${exactAmount} tokens of ${mint.toBase58()}`);

      const pool = await this.poolService.getBestPool(mint);
      if (!pool) {
        throw new Error(`No pool found for token ${mint.toBase58()}`);
      }

      // Calculate minimum SOL to receive
      const minSolAmount = await this.calculateSellSolAmount(
        BigInt(exactAmount * Math.pow(10, DEFAULTS.DECIMALS)),
        mint
      );

      const minSolAfterSlippage = this.calculateWithSlippageSell(minSolAmount, BigInt(slippage));

      const sellInstruction = await this.createSellInstruction(
        pool.address,
        user,
        mint,
        BigInt(exactAmount * Math.pow(10, DEFAULTS.DECIMALS)),
        minSolAfterSlippage
      );

      const instructions = [
        ComputeBudgetProgram.setComputeUnitLimit({
          units: DEFAULTS.COMPUTE_UNITS,
        }),
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: DEFAULTS.COMPUTE_UNIT_PRICE,
        }),
        sellInstruction,
      ];

      const result = await this.transactionService.sendTransaction(
        instructions,
        wallet,
        'PumpSwap Sell'
      );

      if (result.success) {
        logger.info(`Sell transaction successful: ${result.signature}`);
      } else {
        logger.error(`Sell transaction failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      logger.error('Error in sell transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sell percentage of tokens
   */
  async sellPercentage(params: SellParams): Promise<TransactionResult> {
    try {
      const { mint, user, percentage = 100, slippage = DEFAULTS.SLIPPAGE } = params;

      if (percentage <= 0 || percentage > 100) {
        throw new Error('Percentage must be between 0 and 100');
      }

      logger.info(`Starting sell transaction for ${percentage}% of ${mint.toBase58()}`);

      // Get current token balance
      const tokenBalance = await this.tokenService.getTokenBalance(mint, user);
      if (tokenBalance === 0) {
        throw new Error('No tokens to sell');
      }

      const amountToSell = (tokenBalance * percentage) / 100;
      logger.info(`Selling ${amountToSell} tokens (${percentage}% of ${tokenBalance})`);

      return await this.sellExactAmount({
        mint,
        user,
        exactAmount: amountToSell,
        slippage,
      });
    } catch (error) {
      logger.error('Error in sell percentage transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get current price for a token
   */
  async getPrice(mint: PublicKey): Promise<number | null> {
    return await this.poolService.getPrice(mint);
  }

  /**
   * Get pool information
   */
  async getPoolInfo(mint: PublicKey) {
    const pool = await this.poolService.getBestPool(mint);
    return pool;
  }

  // Private helper methods
  private async calculateBuyTokenAmount(solAmount: bigint, mint: PublicKey): Promise<bigint> {
    // Implementation would use pool data to calculate expected tokens
    // This is a simplified version
    const pool = await this.poolService.getBestPool(mint);
    if (!pool) throw new Error('No pool found');

    const { baseReserve, quoteReserve } = pool.poolData;
    const k = baseReserve * quoteReserve;
    const newQuoteReserve = quoteReserve + solAmount;
    const newBaseReserve = k / newQuoteReserve;
    return baseReserve - newBaseReserve;
  }

  private async calculateSellSolAmount(tokenAmount: bigint, mint: PublicKey): Promise<bigint> {
    // Implementation would use pool data to calculate expected SOL
    // This is a simplified version
    const pool = await this.poolService.getBestPool(mint);
    if (!pool) throw new Error('No pool found');

    const { baseReserve, quoteReserve } = pool.poolData;
    const k = baseReserve * quoteReserve;
    const newBaseReserve = baseReserve + tokenAmount;
    const newQuoteReserve = k / newBaseReserve;
    return quoteReserve - newQuoteReserve;
  }

  private calculateWithSlippageBuy(amount: bigint, basisPoints: bigint): bigint {
    return (amount * (10000n - basisPoints)) / 10000n;
  }

  private calculateWithSlippageSell(amount: bigint, basisPoints: bigint): bigint {
    return (amount * (10000n - basisPoints)) / 10000n;
  }

  private async createBuyInstruction(
    poolId: PublicKey,
    user: PublicKey,
    mint: PublicKey,
    baseAmountOut: bigint,
    maxQuoteAmountIn: bigint
  ): Promise<TransactionInstruction> {
    const ata = getAssociatedTokenAddressSync(mint, user);

    return new TransactionInstruction({
      keys: [
        { pubkey: poolId, isSigner: false, isWritable: true },
        { pubkey: user, isSigner: false, isWritable: false },
        { pubkey: ata, isSigner: false, isWritable: true },
        { pubkey: PUMPSWAP_ADDRESSES.GLOBAL, isSigner: false, isWritable: false },
        { pubkey: PUMPSWAP_ADDRESSES.EVENT_AUTHORITY, isSigner: false, isWritable: false },
        { pubkey: PUMPSWAP_ADDRESSES.FEE_RECIPIENT, isSigner: false, isWritable: true },
        { pubkey: PUMPSWAP_ADDRESSES.FEE_RECIPIENT_ATA, isSigner: false, isWritable: true },
        { pubkey: PROGRAM_IDS.TOKEN, isSigner: false, isWritable: false },
        { pubkey: PROGRAM_IDS.ASSOCIATED_TOKEN, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.PUMP_AMM,
      data: Buffer.concat([
        INSTRUCTION_DISCRIMINATORS.BUY,
        Buffer.from(baseAmountOut.toString(16).padStart(16, '0'), 'hex'),
        Buffer.from(maxQuoteAmountIn.toString(16).padStart(16, '0'), 'hex'),
      ]),
    });
  }

  private async createSellInstruction(
    poolId: PublicKey,
    user: PublicKey,
    mint: PublicKey,
    baseAmountIn: bigint,
    minQuoteAmountOut: bigint
  ): Promise<TransactionInstruction> {
    const ata = getAssociatedTokenAddressSync(mint, user);

    return new TransactionInstruction({
      keys: [
        { pubkey: poolId, isSigner: false, isWritable: true },
        { pubkey: user, isSigner: false, isWritable: false },
        { pubkey: ata, isSigner: false, isWritable: true },
        { pubkey: PUMPSWAP_ADDRESSES.GLOBAL, isSigner: false, isWritable: false },
        { pubkey: PUMPSWAP_ADDRESSES.EVENT_AUTHORITY, isSigner: false, isWritable: false },
        { pubkey: PUMPSWAP_ADDRESSES.FEE_RECIPIENT, isSigner: false, isWritable: true },
        { pubkey: PUMPSWAP_ADDRESSES.FEE_RECIPIENT_ATA, isSigner: false, isWritable: true },
        { pubkey: PROGRAM_IDS.TOKEN, isSigner: false, isWritable: false },
        { pubkey: PROGRAM_IDS.ASSOCIATED_TOKEN, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_IDS.PUMP_AMM,
      data: Buffer.concat([
        INSTRUCTION_DISCRIMINATORS.SELL,
        Buffer.from(baseAmountIn.toString(16).padStart(16, '0'), 'hex'),
        Buffer.from(minQuoteAmountOut.toString(16).padStart(16, '0'), 'hex'),
      ]),
    });
  }
} 