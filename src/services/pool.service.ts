import { Program } from '@coral-xyz/anchor';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { PumpSwap, IDL } from '../IDL';
import { connection } from '../connection';
import { PROGRAM_IDS, TOKEN_ADDRESSES, DEFAULTS } from '../config';
import { Pool, PoolWithPrice, PoolInfo } from '../types';
import { logger } from '../utils/logger';

// Initialize program
const program = new Program(IDL, {
  connection,
});

export class PoolService {
  private connection: Connection;
  private program: Program<PumpSwap>;

  constructor(connectionInstance: Connection = connection) {
    this.connection = connectionInstance;
    this.program = new Program(IDL, { connection: this.connection });
  }

  /**
   * Gets pools with base mint (token as base)
   */
  private async getPoolsWithBaseMint(mintAddress: PublicKey): Promise<Pool[]> {
    try {
      const response = await this.connection.getProgramAccounts(PROGRAM_IDS.PUMP_AMM, {
        filters: [
          { dataSize: 211 },
          {
            memcmp: {
              offset: 43,
              bytes: mintAddress.toBase58(),
            },
          },
        ],
      });

      return response.map((pool) => {
        const data = Buffer.from(pool.account.data);
        const poolData = this.program.coder.accounts.decode('pool', data);
        return {
          address: pool.pubkey,
          is_native_base: false,
          poolData,
        };
      });
    } catch (error) {
      logger.error('Error fetching pools with base mint:', error);
      throw error;
    }
  }

  /**
   * Gets pools with quote mint (token as quote)
   */
  private async getPoolsWithQuoteMint(mintAddress: PublicKey): Promise<Pool[]> {
    try {
      const response = await this.connection.getProgramAccounts(PROGRAM_IDS.PUMP_AMM, {
        filters: [
          { dataSize: 211 },
          {
            memcmp: {
              offset: 75,
              bytes: mintAddress.toBase58(),
            },
          },
        ],
      });

      return response.map((pool) => {
        const data = Buffer.from(pool.account.data);
        const poolData = this.program.coder.accounts.decode('pool', data);
        return {
          address: pool.pubkey,
          is_native_base: true,
          poolData,
        };
      });
    } catch (error) {
      logger.error('Error fetching pools with quote mint:', error);
      throw error;
    }
  }

  /**
   * Gets pools with base mint and WSOL as quote
   */
  private async getPoolsWithBaseMintQuoteWSOL(mintAddress: PublicKey): Promise<Pool[]> {
    try {
      const response = await this.connection.getProgramAccounts(PROGRAM_IDS.PUMP_AMM, {
        filters: [
          { dataSize: 211 },
          {
            memcmp: {
              offset: 43,
              bytes: mintAddress.toBase58(),
            },
          },
          {
            memcmp: {
              offset: 75,
              bytes: TOKEN_ADDRESSES.WSOL.toBase58(),
            },
          },
        ],
      });

      return response.map((pool) => {
        const data = Buffer.from(pool.account.data);
        const poolData = this.program.coder.accounts.decode('pool', data);
        return {
          address: pool.pubkey,
          is_native_base: false,
          poolData,
        };
      });
    } catch (error) {
      logger.error('Error fetching pools with base mint and WSOL quote:', error);
      throw error;
    }
  }

  /**
   * Calculates price and liquidity for a pool
   */
  private async getPriceAndLiquidity(pool: Pool): Promise<PoolWithPrice> {
    try {
      const baseReserve = pool.poolData.baseReserve;
      const quoteReserve = pool.poolData.quoteReserve;

      if (!baseReserve || !quoteReserve || baseReserve === 0n || quoteReserve === 0n) {
        throw new Error('Invalid pool reserves');
      }

      const price = Number(quoteReserve) / Number(baseReserve);
      const reserves = {
        native: Number(quoteReserve) / LAMPORTS_PER_SOL,
        token: Number(baseReserve) / Math.pow(10, DEFAULTS.DECIMALS),
      };

      return {
        ...pool,
        price,
        reserves,
      };
    } catch (error) {
      logger.error('Error calculating price and liquidity:', error);
      throw error;
    }
  }

  /**
   * Gets all pools with prices for a given mint
   */
  async getPoolsWithPrices(mintAddress: PublicKey): Promise<PoolWithPrice[]> {
    try {
      const [basePools, quotePools, wsolPools] = await Promise.all([
        this.getPoolsWithBaseMint(mintAddress),
        this.getPoolsWithQuoteMint(mintAddress),
        this.getPoolsWithBaseMintQuoteWSOL(mintAddress),
      ]);

      const allPools = [...basePools, ...quotePools, ...wsolPools];
      const poolsWithPrices = await Promise.all(
        allPools.map((pool) => this.getPriceAndLiquidity(pool))
      );

      return poolsWithPrices.filter((pool) => pool.price > 0);
    } catch (error) {
      logger.error('Error getting pools with prices:', error);
      throw error;
    }
  }

  /**
   * Gets the best pool for trading (highest liquidity)
   */
  async getBestPool(mintAddress: PublicKey): Promise<PoolWithPrice | null> {
    try {
      const pools = await this.getPoolsWithPrices(mintAddress);
      
      if (pools.length === 0) {
        logger.warn(`No pools found for mint: ${mintAddress.toBase58()}`);
        return null;
      }

      // Sort by liquidity (native reserve) and return the best
      const bestPool = pools.reduce((best, current) => 
        current.reserves.native > best.reserves.native ? current : best
      );

      logger.info(`Best pool found: ${bestPool.address.toBase58()} with price: ${bestPool.price}`);
      return bestPool;
    } catch (error) {
      logger.error('Error getting best pool:', error);
      throw error;
    }
  }

  /**
   * Gets pool information
   */
  async getPoolInfo(poolAddress: PublicKey): Promise<PoolInfo | null> {
    try {
      const accountInfo = await this.connection.getAccountInfo(poolAddress);
      if (!accountInfo) {
        return null;
      }

      const poolData = this.program.coder.accounts.decode('pool', accountInfo.data);
      
      return {
        poolId: poolAddress,
        baseMint: poolData.baseMint,
        quoteMint: poolData.quoteMint,
        baseReserve: poolData.baseReserve,
        quoteReserve: poolData.quoteReserve,
        price: Number(poolData.quoteReserve) / Number(poolData.baseReserve),
      };
    } catch (error) {
      logger.error('Error getting pool info:', error);
      throw error;
    }
  }

  /**
   * Gets the current price for a token
   */
  async getPrice(mintAddress: PublicKey): Promise<number | null> {
    try {
      const bestPool = await this.getBestPool(mintAddress);
      return bestPool?.price || null;
    } catch (error) {
      logger.error('Error getting price:', error);
      throw error;
    }
  }
} 