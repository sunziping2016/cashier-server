import {Document} from "mongoose";
import * as mongoose from 'mongoose';

declare module 'mongoose' {
  interface Model<T extends Document, QueryHelpers = {}> {
    synchronize(documents?: any, options?: {
      saveOnSynchronize?: boolean,
    }): QueryCursor<T>;
  }
}
