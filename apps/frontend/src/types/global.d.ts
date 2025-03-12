import React from 'react';

declare global {
  // Add JSX intrinsic elements to fix errors
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }

  // Add window.solana declaration
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: string }>;
      disconnect: () => Promise<void>;
      signTransaction: (transaction: any) => Promise<any>;
      signAllTransactions: (transactions: any[]) => Promise<any[]>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      request: (request: { method: string, params?: any }) => Promise<any>;
    };
  }

  // Add process type definition
  namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_SOLANA_NETWORK?: string;
      REACT_APP_SOLANA_RPC_HOST?: string;
      REACT_APP_MATERIAL_PROGRAM_ID?: string;
      REACT_APP_RECIPE_PROGRAM_ID?: string;
      REACT_APP_GUILD_PROGRAM_ID?: string;
      NODE_ENV: 'development' | 'production' | 'test';
      PUBLIC_URL: string;
    }
  }
}

// Augment styled-components to properly handle 'as' props 
declare module 'styled-components' {
  export interface StyledComponentProps<T extends keyof JSX.IntrinsicElements | React.ComponentType<any>, U extends object, V extends object = {}> {
    as?: T;
    forwardedAs?: T;
  }

  export interface DefaultTheme {
    [key: string]: any;
  }
}

export {}; 