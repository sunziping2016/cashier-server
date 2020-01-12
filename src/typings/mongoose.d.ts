import {Document, SchemaType} from 'mongoose';
import * as mongoose from 'mongoose';

declare module 'mongoose' {
  interface Model<T extends Document, QueryHelpers = {}> {
    synchronize(documents?: any, options?: {
      saveOnSynchronize?: boolean,
    }): QueryCursor<T>;

    search(query: any, callback: (err: any, results: any) => void);
    search(query: any, options: any,
           callback: (err: any, results: any) => void);
  }

  interface Schema<T = any> {
    paths: {[path: string]: SchemaType};
  }
}
