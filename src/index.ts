// Main SDK exports
export { PumpSwapSDK } from './sdk/pumpswap.sdk';

// Service exports
export { PoolService } from './services/pool.service';
export { TokenService } from './services/token.service';
export { TransactionService } from './services/transaction.service';

// Type exports
export type {
  Pool,
  PoolWithPrice,
  TokenBalance,
  WalletState,
  BuyParams,
  SellParams,
  TransactionResult,
  PoolInfo,
  Config,
  LoggerConfig,
} from './types';

// Configuration exports
export {
  PROGRAM_IDS,
  TOKEN_ADDRESSES,
  PUMPSWAP_ADDRESSES,
  INSTRUCTION_DISCRIMINATORS,
  DEFAULTS,
  config,
  loggerConfig,
  QUOTE_TOKENS,
} from './config';

// Connection exports
export {
  connection,
  nozomiConnection,
  wallet,
  createConnection,
  validateConnection,
  getCurrentSlot,
  getLatestBlockhash,
} from './connection';

// Utility exports
export {
  retrieveEnvVariable,
  retrieveEnvVariableWithDefault,
  retrieveNumericEnvVariable,
  validateRequiredEnvVariables,
} from './utils/env';

export { logger } from './utils/logger';

// IDL exports
export { PumpSwap, IDL } from './IDL';

// Version information
export const VERSION = '2.0.0';
export const SDK_NAME = 'PumpSwap SDK';

// Default export
export default PumpSwapSDK; 