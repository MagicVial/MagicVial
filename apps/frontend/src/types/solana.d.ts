declare module '@solana/web3.js' {
  import { Buffer } from 'buffer';
  
  export class Connection {
    constructor(endpoint: string, commitment: string);
    getAccountInfo(publicKey: PublicKey): Promise<any>;
    getBalance(publicKey: PublicKey): Promise<number>;
    getRecentBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }>;
    getSignatureStatus(signature: string): Promise<any>;
    getParsedProgramAccounts(programId: PublicKey, options?: any): Promise<any[]>;
    confirmTransaction(signature: string): Promise<any>;
  }
  
  export class PublicKey {
    constructor(value: string | Uint8Array | number[]);
    static findProgramAddressSync(seeds: Buffer[], programId: PublicKey): [PublicKey, number];
    static createWithSeed(fromPublicKey: PublicKey, seed: string, programId: PublicKey): Promise<PublicKey>;
    toBase58(): string;
    toBuffer(): Buffer;
    toString(): string;
    equals(publicKey: PublicKey): boolean;
  }
  
  export class Transaction {
    constructor();
    add(...instructions: TransactionInstruction[]): Transaction;
    sign(...signers: Keypair[]): void;
    serialize(config?: any): Buffer;
    feePayer?: PublicKey;
    recentBlockhash?: string;
  }
  
  export class TransactionInstruction {
    constructor(options: {
      keys: Array<{ pubkey: PublicKey; isSigner: boolean; isWritable: boolean }>;
      programId: PublicKey;
      data: Buffer;
    });
  }
  
  export class Keypair {
    constructor();
    static generate(): Keypair;
    static fromSecretKey(secretKey: Uint8Array): Keypair;
    static fromSeed(seed: Uint8Array): Keypair;
    publicKey: PublicKey;
    secretKey: Uint8Array;
  }
  
  export class SystemProgram {
    static programId: PublicKey;
    static createAccount(params: any): TransactionInstruction;
    static transfer(params: any): TransactionInstruction;
    static createAccountWithSeed(params: any): TransactionInstruction;
  }
  
  export const LAMPORTS_PER_SOL: number;
  export const clusterApiUrl: (cluster: string) => string;
  export function sendAndConfirmTransaction(
    connection: Connection,
    transaction: Transaction,
    signers: Keypair[]
  ): Promise<string>;
}

declare module '@solana/wallet-adapter-react' {
  import { PublicKey, Connection } from '@solana/web3.js';
  import React from 'react';
  
  export interface WalletContextState {
    wallet: Wallet | null;
    adapter: any | null;
    publicKey: PublicKey | null;
    ready: boolean;
    connected: boolean;
    connecting: boolean;
    disconnecting: boolean;
    select(walletName: string): void;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendTransaction(transaction: any, connection: Connection): Promise<string>;
    signTransaction(transaction: any): Promise<any>;
    signAllTransactions(transactions: any[]): Promise<any[]>;
    signMessage(message: Uint8Array): Promise<Uint8Array>;
  }
  
  export interface Wallet {
    name: string;
    icon: string;
    publicKey: PublicKey | null;
    connecting: boolean;
    connected: boolean;
    readyState: number;
    adapter: any;
  }
  
  export function useWallet(): WalletContextState;
  export function useConnection(): { connection: Connection };
  
  export const WalletProvider: React.FC<{
    children: React.ReactNode;
    wallets: any[];
    autoConnect?: boolean;
  }>;
  
  export const ConnectionProvider: React.FC<{
    children: React.ReactNode;
    endpoint: string;
    config?: any;
  }>;
}

declare module '@solana/wallet-adapter-base' {
  import { PublicKey } from '@solana/web3.js';
  
  export interface WalletAdapterProps {
    publicKey: PublicKey | null;
    connecting: boolean;
    connected: boolean;
    readyState: number;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendTransaction(transaction: any, connection: any): Promise<string>;
    signTransaction(transaction: any): Promise<any>;
    signAllTransactions(transactions: any[]): Promise<any[]>;
    signMessage(message: Uint8Array): Promise<Uint8Array>;
  }
  
  export enum WalletReadyState {
    Installed = 'Installed',
    NotDetected = 'NotDetected',
    Loadable = 'Loadable',
    Unsupported = 'Unsupported',
  }
  
  export abstract class BaseWalletAdapter implements WalletAdapterProps {
    publicKey: PublicKey | null;
    connecting: boolean;
    connected: boolean;
    readyState: WalletReadyState;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendTransaction(transaction: any, connection: any): Promise<string>;
    signTransaction(transaction: any): Promise<any>;
    signAllTransactions(transactions: any[]): Promise<any[]>;
    signMessage(message: Uint8Array): Promise<Uint8Array>;
  }
}

declare module '@solana/wallet-adapter-wallets' {
  import { BaseWalletAdapter } from '@solana/wallet-adapter-base';
  
  export class PhantomWalletAdapter extends BaseWalletAdapter {}
  export class SolflareWalletAdapter extends BaseWalletAdapter {}
  export class SolletWalletAdapter extends BaseWalletAdapter {}
  export class TorusWalletAdapter extends BaseWalletAdapter {}
  export class LedgerWalletAdapter extends BaseWalletAdapter {}
}

declare module '@solana/wallet-adapter-react-ui' {
  import React from 'react';
  
  export const WalletModalProvider: React.FC<{
    children: React.ReactNode;
  }>;
  
  export const WalletMultiButton: React.FC<{
    className?: string;
  }>;
  
  export const WalletConnectButton: React.FC<{
    className?: string;
  }>;
  
  export const WalletDisconnectButton: React.FC<{
    className?: string;
  }>;
  
  export const WalletModal: React.FC<{
    className?: string;
  }>;
}

declare module '@project-serum/anchor' {
  import { Buffer } from 'buffer';
  import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
  
  export class Provider {
    connection: Connection;
    wallet: any;
    publicKey: PublicKey;
    constructor(connection: Connection, wallet: any, opts: any);
    static defaultOptions(): any;
    static local(url?: string, opts?: any): Provider;
    static env(): Provider;
    sendAndConfirm(tx: Transaction, signers?: any[], opts?: any): Promise<string>;
    send(tx: Transaction, signers?: any[], opts?: any): Promise<string>;
  }
  
  export class BN {
    constructor(value: string | number | BN, base?: number);
    toNumber(): number;
    toString(): string;
    toBuffer(endian?: string, length?: number): Buffer;
  }
  
  export class Idl {
    static parse(idl: string): any;
  }
  
  export class Program {
    constructor(idl: any, programId: PublicKey, provider: Provider);
    account: Record<string, any>;
    instruction: Record<string, any>;
    programId: PublicKey;
    provider: Provider;
    rpc: Record<string, any>;
  }
  
  export function setProvider(provider: Provider): void;
}

declare module '@solana/spl-token' {
  import { PublicKey, Connection, TransactionInstruction } from '@solana/web3.js';
  
  export function createMint(
    connection: Connection,
    payer: any,
    mintAuthority: PublicKey,
    freezeAuthority: PublicKey | null,
    decimals: number
  ): Promise<PublicKey>;
  
  export function createAccount(
    connection: Connection,
    payer: any,
    mint: PublicKey,
    owner: PublicKey
  ): Promise<PublicKey>;
  
  export function mintTo(
    connection: Connection,
    payer: any,
    mint: PublicKey,
    destination: PublicKey,
    authority: any,
    amount: number | bigint
  ): Promise<TransactionInstruction>;
  
  export function transfer(
    connection: Connection,
    payer: any,
    source: PublicKey,
    destination: PublicKey,
    owner: any,
    amount: number | bigint
  ): Promise<TransactionInstruction>;
  
  export function getAccount(
    connection: Connection,
    address: PublicKey
  ): Promise<any>;
  
  export function getMint(
    connection: Connection,
    address: PublicKey
  ): Promise<any>;
  
  export const TOKEN_PROGRAM_ID: PublicKey;
}

// Declare global Buffer type
declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
  var Buffer: typeof import('buffer').Buffer;
} 