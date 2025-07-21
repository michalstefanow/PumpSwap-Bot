import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, getAccount } from '@solana/spl-token';
import { connection } from '../connection';
import { DEFAULTS } from '../config';
import { TokenBalance } from '../types';
import { logger } from '../utils/logger';

export class TokenService {
  private connection: Connection;

  constructor(connectionInstance: Connection = connection) {
    this.connection = connectionInstance;
  }

  /**
   * Get SOL balance for a wallet
   */
  async getSolBalance(pubKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(pubKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      logger.error('Error getting SOL balance:', error);
      throw error;
    }
  }

  /**
   * Get token balance for a specific mint
   */
  async getTokenBalance(mintAddress: PublicKey, pubKey: PublicKey, allowOffCurve = false): Promise<number> {
    try {
      const ata = getAssociatedTokenAddressSync(mintAddress, pubKey, allowOffCurve);
      const balance = await this.connection.getTokenAccountBalance(ata, 'confirmed');
      return balance.value.uiAmount || 0;
    } catch (error) {
      logger.debug(`No token account found for mint ${mintAddress.toBase58()}`);
      return 0;
    }
  }

  /**
   * Get all token balances for a wallet
   */
  async getAllTokenBalances(pubKey: PublicKey): Promise<TokenBalance[]> {
    try {
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(pubKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      });

      return tokenAccounts.value.map((account) => ({
        mint: account.account.data.parsed.info.mint,
        balance: account.account.data.parsed.info.tokenAmount.uiAmount || 0,
        decimals: account.account.data.parsed.info.tokenAmount.decimals,
      }));
    } catch (error) {
      logger.error('Error getting all token balances:', error);
      throw error;
    }
  }

  /**
   * Get token decimals
   */
  async getTokenDecimals(mintAddress: PublicKey): Promise<number> {
    try {
      const mintInfo = await this.connection.getParsedAccountInfo(mintAddress);
      if (mintInfo.value?.data && 'parsed' in mintInfo.value.data) {
        return (mintInfo.value.data as any).parsed.info.decimals;
      }
      return DEFAULTS.DECIMALS;
    } catch (error) {
      logger.warn(`Could not get decimals for mint ${mintAddress.toBase58()}, using default`);
      return DEFAULTS.DECIMALS;
    }
  }

  /**
   * Check if token account exists
   */
  async tokenAccountExists(mintAddress: PublicKey, pubKey: PublicKey): Promise<boolean> {
    try {
      const ata = getAssociatedTokenAddressSync(mintAddress, pubKey);
      const accountInfo = await this.connection.getAccountInfo(ata);
      return accountInfo !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get token account address
   */
  getTokenAccountAddress(mintAddress: PublicKey, pubKey: PublicKey, allowOffCurve = false): PublicKey {
    return getAssociatedTokenAddressSync(mintAddress, pubKey, allowOffCurve);
  }

  /**
   * Print SOL balance to console
   */
  async printSolBalance(pubKey: PublicKey, info = ''): Promise<void> {
    try {
      const balance = await this.getSolBalance(pubKey);
      console.log(
        `${info ? info + ' ' : ''}${pubKey.toBase58()}:`,
        balance,
        'SOL'
      );
    } catch (error) {
      logger.error('Error printing SOL balance:', error);
    }
  }

  /**
   * Print token balance to console
   */
  async printTokenBalance(mintAddress: PublicKey, pubKey: PublicKey, info = ''): Promise<void> {
    try {
      const balance = await this.getTokenBalance(mintAddress, pubKey);
      if (balance === 0) {
        console.log(
          `${info ? info + ' ' : ''}${pubKey.toBase58()}:`,
          'No Account Found'
        );
      } else {
        console.log(
          `${info ? info + ' ' : ''}${pubKey.toBase58()}:`,
          balance,
          'tokens'
        );
      }
    } catch (error) {
      logger.error('Error printing token balance:', error);
    }
  }
} 