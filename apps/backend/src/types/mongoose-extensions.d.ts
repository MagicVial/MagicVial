import { Document } from 'mongoose';

declare module 'mongoose' {
  // Extend Document interface to add isModified method and _id property
  interface Document {
    isModified(path: string): boolean;
    _id: any;
  }
  
  // Extend Schema namespace to add Types.ObjectId
  namespace Schema {
    namespace Types {
      class ObjectId {
        constructor(id?: string | number | ObjectId);
      }
    }
  }
  
  // Add connect method
  export function connect(uri: string, options?: any): Promise<any>;
  
  // Add model method
  export function model<T extends Document>(name: string, schema: Schema): any;
  
  // Add connection property
  export const connection: {
    on(event: string, callback: Function): void;
    close(): Promise<void>;
  };
  
  // Add models property
  export const models: {
    [key: string]: any;
  };
} 