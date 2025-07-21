import { Commitment, PublicKey } from '@solana/web3.js';
import { Config, LoggerConfig } from '../types';
import { retrieveEnvVariable } from '../utils/env';

// Program IDs
export const PROGRAM_IDS = {
  PUMP_AMM: new PublicKey('pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA'),
  ASSOCIATED_TOKEN: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
  TOKEN: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
  SYSTEM: new PublicKey('11111111111111111111111111111111'),
} as const;

// Token Addresses
export const TOKEN_ADDRESSES = {
  WSOL: new PublicKey('So11111111111111111111111111111111111111112'),
  USDC: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  USDT: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
} as const;

// PumpSwap Specific Addresses
export const PUMPSWAP_ADDRESSES = {
  GLOBAL: new PublicKey('ADyA8hdefvWN2dbGGWFotbzWxrAvLW83WG6QCVXvJKqw'),
  EVENT_AUTHORITY: new PublicKey('GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR'),
  FEE_RECIPIENT: new PublicKey('62qc2CNXwrYqQScmEdiZFFAnJR262PxWEuNQtxfafNgV'),
  FEE_RECIPIENT_ATA: new PublicKey('94qWNrtmfn42h3ZjUZwWvK1MEo9uVmmrBPd2hpNjYDjb'),
} as const;

// Instruction Discriminators
export const INSTRUCTION_DISCRIMINATORS = {
  BUY: new Uint8Array([102, 6, 61, 18, 1, 218, 235, 234]),
  SELL: new Uint8Array([51, 230, 133, 164, 1, 127, 131, 173]),
} as const;

// Default Values
export const DEFAULTS = {
  DECIMALS: 6,
  SLIPPAGE: 500, // 5% in basis points
  COMPUTE_UNITS: 70000,
  COMPUTE_UNIT_PRICE: 696969,
  LAMPORTS_PER_SOL: 1000000000,
} as const;

// Network Configuration
export const NETWORK = 'mainnet-beta' as const;

// Load configuration from environment
export const config: Config = {
  rpcEndpoint: retrieveEnvVariable('RPC_ENDPOINT'),
  wsEndpoint: retrieveEnvVariable('RPC_WEBSOCKET_ENDPOINT'),
  commitment: retrieveEnvVariable('COMMITMENT_LEVEL'),
  logLevel: retrieveEnvVariable('LOG_LEVEL'),
  jitoTips: parseInt(retrieveEnvVariable('JITO_TIPS')),
  defaultSlippage: DEFAULTS.SLIPPAGE,
  maxComputeUnits: DEFAULTS.COMPUTE_UNITS,
  computeUnitPrice: DEFAULTS.COMPUTE_UNIT_PRICE,
};

// Logger Configuration
export const loggerConfig: LoggerConfig = {
  level: config.logLevel,
  pretty: true,
  timestamp: true,
};

// Quote Tokens for Pool Discovery
export const QUOTE_TOKENS = [
  TOKEN_ADDRESSES.USDC.toBase58(),
  'SOL',
  TOKEN_ADDRESSES.USDT.toBase58(),
  TOKEN_ADDRESSES.WSOL.toBase58(),
] as const; 