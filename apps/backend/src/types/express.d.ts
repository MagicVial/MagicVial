declare module 'express' {
  export interface Request {
    user?: any;
    token?: string;
    solanaConnection?: any;
    [key: string]: any;
  }
  
  export interface Response {
    [key: string]: any;
  }
  
  export interface NextFunction {
    (err?: any): void;
  }
  
  export function Router(): any;
}

declare module 'express-validator' {
  export function body(field: string): any;
  export function param(field: string): any;
  export function validationResult(req: any): any;
}

declare module 'cors' {
  import { RequestHandler } from 'express';
  function cors(options?: any): RequestHandler;
  export default cors;
}

declare module 'helmet' {
  import { RequestHandler } from 'express';
  function helmet(options?: any): RequestHandler;
  export default helmet;
}

declare module 'morgan' {
  import { RequestHandler } from 'express';
  function morgan(format: string, options?: any): RequestHandler;
  export default morgan;
}

declare module 'dotenv' {
  export function config(options?: any): void;
}

declare module '@solana/web3.js' {
  export class Connection {
    constructor(endpoint: string, commitmentOrConfig?: any);
    getBalance(publicKey: any): Promise<number>;
    getParsedTokenAccountsByOwner(owner: any, filter: any): Promise<any>;
    getSignatureStatus(signature: string): Promise<any>;
  }
  
  export class PublicKey {
    constructor(value: string | number | Buffer | Array<number> | Uint8Array);
  }
  
  export class Transaction {
    constructor();
  }
  
  export class Keypair {
    static generate(): Keypair;
  }
  
  export class SystemProgram {
    static transfer(params: any): any;
  }
}

declare module '@solana/spl-token' {
  export class Token {
    constructor(connection: any, publicKey: any, programId: any, payer: any);
  }
  
  export const TOKEN_PROGRAM_ID: any;
}

declare module 'mongoose' {
  export * from 'mongoose';
  export function connect(uri: string, options?: any): Promise<any>;
} 