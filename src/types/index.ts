import { PublicKey } from '@solana/web3.js';

export interface Pool {
  address: PublicKey;
  is_native_base: boolean;
  poolData: any;
}

export interface PoolWithPrice extends Pool {
  price: number;
  reserves: {
    native: number;
    token: number;
  };
}

export interface TokenBalance {
  mint: PublicKey;
  balance: number;
  decimals: number;
}

export interface WalletState {
  publicKey: string;
  solBalance: number;
  tokenBalances: TokenBalance[];
}

export interface BuyParams {
  mint: PublicKey;
  user: PublicKey;
  solAmount: number;
  slippage?: number;
}

export interface SellParams {
  mint: PublicKey;
  user: PublicKey;
  percentage?: number;
  exactAmount?: number;
  slippage?: number;
}

export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export interface PoolInfo {
  poolId: PublicKey;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  baseReserve: bigint;
  quoteReserve: bigint;
  price: number;
}

export interface Config {
  rpcEndpoint: string;
  wsEndpoint: string;
  commitment: string;
  logLevel: string;
  jitoTips: number;
  defaultSlippage: number;
  maxComputeUnits: number;
  computeUnitPrice: number;
}

export interface LoggerConfig {
  level: string;
  pretty: boolean;
  timestamp: boolean;
} 