import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  SendOptions,
} from '@solana/web3.js';
import { connection } from '../connection';
import { sendNozomiTx } from '../nozomi/tx-submission';
import { sendBundle } from '../jito';
import { TransactionResult } from '../types';
import { logger } from '../utils/logger';

export class TransactionService {
  private connection: Connection;

  constructor(connectionInstance: Connection = connection) {
    this.connection = connectionInstance;
  }

  /**
   * Send transaction with standard method
   */
  async sendTransaction(
    instructions: TransactionInstruction[],
    signer: Keypair,
    description = 'Transaction',
    options: SendOptions = {}
  ): Promise<TransactionResult> {
    try {
      logger.info(`Sending ${description}...`);

      const latestBlockhash = await this.connection.getLatestBlockhash();
      
      const messageV0 = new TransactionMessage({
        payerKey: signer.publicKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(messageV0);
      transaction.sign([signer]);

      const signature = await this.connection.sendTransaction(transaction, options);
      
      logger.info(`${description} sent with signature: ${signature}`);
      
      return {
        success: true,
        signature,
      };
    } catch (error) {
      logger.error(`Error sending ${description}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send transaction via Nozomi (MEV protection)
   */
  async sendNozomiTransaction(
    instructions: TransactionInstruction[],
    signer: Keypair,
    description = 'Nozomi Transaction'
  ): Promise<TransactionResult> {
    try {
      logger.info(`Sending ${description} via Nozomi...`);

      const latestBlockhash = await this.connection.getLatestBlockhash();
      
      const result = await sendNozomiTx(
        instructions,
        signer,
        latestBlockhash,
        'PumpSwap',
        description.toLowerCase()
      );

      if (result.success) {
        logger.info(`${description} sent via Nozomi: ${result.signature}`);
      } else {
        logger.error(`${description} failed via Nozomi: ${result.error}`);
      }

      return result;
    } catch (error) {
      logger.error(`Error sending ${description} via Nozomi:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send transaction as bundle (Jito)
   */
  async sendBundleTransaction(
    instructions: TransactionInstruction[],
    signer: Keypair,
    description = 'Bundle Transaction'
  ): Promise<TransactionResult> {
    try {
      logger.info(`Sending ${description} as bundle...`);

      const latestBlockhash = await this.connection.getLatestBlockhash();
      
      const messageV0 = new TransactionMessage({
        payerKey: signer.publicKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(messageV0);
      transaction.sign([signer]);

      // Get pool info for bundle submission
      // This would need to be passed in or retrieved based on the transaction type
      const pool = new PublicKey('11111111111111111111111111111111'); // Placeholder

      const result = await sendBundle(
        false,
        latestBlockhash.blockhash,
        transaction,
        pool,
        signer
      );

      if (result.success) {
        logger.info(`${description} sent as bundle: ${result.signature}`);
      } else {
        logger.error(`${description} failed as bundle: ${result.error}`);
      }

      return result;
    } catch (error) {
      logger.error(`Error sending ${description} as bundle:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build transaction without sending
   */
  async buildTransaction(
    instructions: TransactionInstruction[],
    signer: Keypair
  ): Promise<VersionedTransaction> {
    const latestBlockhash = await this.connection.getLatestBlockhash();
    
    const messageV0 = new TransactionMessage({
      payerKey: signer.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);
    transaction.sign([signer]);
    
    return transaction;
  }

  /**
   * Simulate transaction
   */
  async simulateTransaction(
    instructions: TransactionInstruction[],
    signer: Keypair
  ): Promise<{ success: boolean; error?: string; logs?: string[] }> {
    try {
      const transaction = await this.buildTransaction(instructions, signer);
      const simulation = await this.connection.simulateTransaction(transaction);
      
      if (simulation.value.err) {
        return {
          success: false,
          error: JSON.stringify(simulation.value.err),
          logs: simulation.value.logs,
        };
      }

      return {
        success: true,
        logs: simulation.value.logs,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(
    signature: string,
    commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed'
  ): Promise<boolean> {
    try {
      const confirmation = await this.connection.confirmTransaction(signature, commitment);
      return !confirmation.value.err;
    } catch (error) {
      logger.error('Error waiting for confirmation:', error);
      return false;
    }
  }
} 