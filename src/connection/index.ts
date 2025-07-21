import { Connection, Keypair, Commitment } from '@solana/web3.js';
import bs58 from 'bs58';
import { config } from '../config';
import { retrieveEnvVariable } from '../utils/env';
import { logger } from '../utils/logger';

// Main connection instance
export const connection = new Connection(config.rpcEndpoint, {
  wsEndpoint: config.wsEndpoint,
  commitment: config.commitment as Commitment,
});

// Nozomi connection for MEV protection
export const nozomiConnection = new Connection(
  "https://ams1.secure.nozomi.temporal.xyz/?c=YOUR_NOZOMI_API_KEY"
);

// Wallet setup
export const wallet = Keypair.fromSecretKey(
  bs58.decode(retrieveEnvVariable('PRIVATE_KEY'))
);

/**
 * Creates a new connection with custom configuration
 * @param rpcEndpoint - Custom RPC endpoint
 * @param wsEndpoint - Custom WebSocket endpoint
 * @param commitment - Commitment level
 * @returns New Connection instance
 */
export function createConnection(
  rpcEndpoint: string,
  wsEndpoint?: string,
  commitment: Commitment = 'confirmed'
): Connection {
  return new Connection(rpcEndpoint, {
    wsEndpoint,
    commitment,
  });
}

/**
 * Validates connection health
 * @param connection - Connection to validate
 * @returns Promise<boolean> - True if connection is healthy
 */
export async function validateConnection(connection: Connection): Promise<boolean> {
  try {
    const blockHeight = await connection.getBlockHeight();
    logger.info(`Connection validated. Current block height: ${blockHeight}`);
    return true;
  } catch (error) {
    logger.error('Connection validation failed:', error);
    return false;
  }
}

/**
 * Gets the current slot
 * @param connection - Connection instance
 * @returns Promise<number> - Current slot
 */
export async function getCurrentSlot(connection: Connection): Promise<number> {
  try {
    return await connection.getSlot();
  } catch (error) {
    logger.error('Failed to get current slot:', error);
    throw error;
  }
}

/**
 * Gets the latest blockhash
 * @param connection - Connection instance
 * @returns Promise<{blockhash: string, lastValidBlockHeight: number}>
 */
export async function getLatestBlockhash(connection: Connection) {
  try {
    return await connection.getLatestBlockhash();
  } catch (error) {
    logger.error('Failed to get latest blockhash:', error);
    throw error;
  }
} 