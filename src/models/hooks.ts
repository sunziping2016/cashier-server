/**
 * Some common hooks (aka middleware) for mongoose.
 *
 * @module src/models/hooks
 */
import fs from 'fs';
import mongodb from 'mongodb';
import {
  Document,
  DocumentQuery,
  Model,
  ModelUpdateOptions,
  Query,
  QueryFindOneAndUpdateOptions,
  Schema,
} from 'mongoose';
import path from 'path';
import util from 'util';
import logger from 'winston';

const unlinkAsync = util.promisify(fs.unlink);

function parseUpdateArguments(
  conditions: any,
  doc: any,
  options: any,
  callback: any,
): any[] {
  if (typeof options === 'function') {
    // .update(conditions, doc, callback)
    callback = options;
    options = null;
  } else if (typeof doc === 'function') {
    // .update(doc, callback);
    callback = doc;
    doc = conditions;
    conditions = {};
    options = null;
  } else if (typeof conditions === 'function') {
    // .update(callback)
    callback = conditions;
    conditions = undefined;
    doc = undefined;
    options = undefined;
  } else if (typeof conditions === 'object' && !doc && !options && !callback) {
    // .update(doc)
    doc = conditions;
    conditions = undefined;
    options = undefined;
    callback = undefined;
  }
  return [conditions, doc, options, callback];
}

export interface AddDeletedDocument {
  delete(): Promise<this>;
  restore(): Promise<this>;
}

export interface AddDeletedModel<T extends Document, QueryHelpers = {}> {
  // estimatedDocumentCount
  countDocumentsDeleted(
    callback?: (err: any, count: number) => void,
  ): Query<number> & QueryHelpers;
  countDocumentsDeleted(
    criteria: any,
    callback?: (err: any, count: number) => void,
  ): Query<number> & QueryHelpers;
  countDocumentsWithDeleted(
    callback?: (err: any, count: number) => void,
  ): Query<number> & QueryHelpers;
  countDocumentsWithDeleted(
    criteria: any,
    callback?: (err: any, count: number) => void,
  ): Query<number> & QueryHelpers;
  // countDocuments
  // tslint:disable-next-line:adjacent-overload-signatures
  countDocumentsDeleted(
    callback?: (err: any, count: number) => void,
  ): Query<number> & QueryHelpers;
  countDocumentsDeleted(
    criteria: any,
    callback?: (err: any, count: number) => void,
  ): Query<number> & QueryHelpers;
  // tslint:disable-next-line:adjacent-overload-signatures
  countDocumentsWithDeleted(
    callback?: (err: any, count: number) => void,
  ): Query<number> & QueryHelpers;
  countDocumentsWithDeleted(
    criteria: any,
    callback?: (err: any, count: number) => void,
  ): Query<number> & QueryHelpers;
  // find
  findDeleted(
    callback?: (err: any, res: T[]) => void,
  ): DocumentQuery<T[], T> & QueryHelpers;
  findDeleted(
    conditions: any,
    callback?: (err: any, res: T[]) => void,
  ): DocumentQuery<T[], T> & QueryHelpers;
  findDeleted(
    conditions: any,
    projection?: any | null,
    callback?: (err: any, res: T[]) => void,
  ): DocumentQuery<T[], T> & QueryHelpers;
  findDeleted(
    conditions: any,
    projection?: any | null,
    options?: any | null,
    callback?: (err: any, res: T[]) => void,
  ): DocumentQuery<T[], T> & QueryHelpers;
  findWithDeleted(
    callback?: (err: any, res: T[]) => void,
  ): DocumentQuery<T[], T> & QueryHelpers;
  findWithDeleted(
    conditions: any,
    callback?: (err: any, res: T[]) => void,
  ): DocumentQuery<T[], T> & QueryHelpers;
  findWithDeleted(
    conditions: any,
    projection?: any | null,
    callback?: (err: any, res: T[]) => void,
  ): DocumentQuery<T[], T> & QueryHelpers;
  findWithDeleted(
    conditions: any,
    projection?: any | null,
    options?: any | null,
    callback?: (err: any, res: T[]) => void,
  ): DocumentQuery<T[], T> & QueryHelpers;
  // findOne
  findOneDeleted(
    conditions?: any,
    callback?: (err: any, res: T | null) => void,
  ): DocumentQuery<T | null, T> & QueryHelpers;
  findOneDeleted(
    conditions: any,
    projection: any,
    callback?: (err: any, res: T | null) => void,
  ): DocumentQuery<T | null, T> & QueryHelpers;
  findOneDeleted(
    conditions: any,
    projection: any,
    options: any,
    callback?: (err: any, res: T | null) => void,
  ): DocumentQuery<T | null, T> & QueryHelpers;
  findOneWithDeleted(
    conditions?: any,
    callback?: (err: any, res: T | null) => void,
  ): DocumentQuery<T | null, T> & QueryHelpers;
  findOneWithDeleted(
    conditions: any,
    projection: any,
    callback?: (err: any, res: T | null) => void,
  ): DocumentQuery<T | null, T> & QueryHelpers;
  findOneWithDeleted(
    conditions: any,
    projection: any,
    options: any,
    callback?: (err: any, res: T | null) => void,
  ): DocumentQuery<T | null, T> & QueryHelpers;
  // findOneAndUpdate
  findOneAndUpdateDeleted(): DocumentQuery<T | null, T> & QueryHelpers;
  findOneAndUpdateDeleted(
    conditions: any,
    update: any,
    callback?: (err: any, doc: T | null, res: any) => void,
  ): DocumentQuery<T | null, T> & QueryHelpers;
  findOneAndUpdateDeleted(
    conditions: any,
    update: any,
    options: { rawResult: true } & {
      upsert: true;
      new: true;
    } & QueryFindOneAndUpdateOptions,
    callback?: (
      err: any,
      doc: mongodb.FindAndModifyWriteOpResultObject<T>,
      res: any,
    ) => void,
  ): Query<mongodb.FindAndModifyWriteOpResultObject<T>> & QueryHelpers;
  findOneAndUpdateDeleted(
    conditions: any,
    update: any,
    options: { upsert: true; new: true } & QueryFindOneAndUpdateOptions,
    callback?: (err: any, doc: T, res: any) => void,
  ): DocumentQuery<T, T> & QueryHelpers;
  findOneAndUpdateDeleted(
    conditions: any,
    update: any,
    options: { rawResult: true } & QueryFindOneAndUpdateOptions,
    callback?: (
      err: any,
      doc: mongodb.FindAndModifyWriteOpResultObject<T | null>,
      res: any,
    ) => void,
  ): Query<mongodb.FindAndModifyWriteOpResultObject<T | null>> & QueryHelpers;
  findOneAndUpdateDeleted(
    conditions: any,
    update: any,
    options: QueryFindOneAndUpdateOptions,
    callback?: (err: any, doc: T | null, res: any) => void,
  ): DocumentQuery<T | null, T> & QueryHelpers;
  findOneAndUpdateWithDeleted(): DocumentQuery<T | null, T> & QueryHelpers;
  findOneAndUpdateWithDeleted(
    conditions: any,
    update: any,
    callback?: (err: any, doc: T | null, res: any) => void,
  ): DocumentQuery<T | null, T> & QueryHelpers;
  findOneAndUpdateWithDeleted(
    conditions: any,
    update: any,
    options: { rawResult: true } & {
      upsert: true;
      new: true;
    } & QueryFindOneAndUpdateOptions,
    callback?: (
      err: any,
      doc: mongodb.FindAndModifyWriteOpResultObject<T>,
      res: any,
    ) => void,
  ): Query<mongodb.FindAndModifyWriteOpResultObject<T>> & QueryHelpers;
  findOneAndUpdateWithDeleted(
    conditions: any,
    update: any,
    options: { upsert: true; new: true } & QueryFindOneAndUpdateOptions,
    callback?: (err: any, doc: T, res: any) => void,
  ): DocumentQuery<T, T> & QueryHelpers;
  findOneAndUpdateWithDeleted(
    conditions: any,
    update: any,
    options: { rawResult: true } & QueryFindOneAndUpdateOptions,
    callback?: (
      err: any,
      doc: mongodb.FindAndModifyWriteOpResultObject<T | null>,
      res: any,
    ) => void,
  ): Query<mongodb.FindAndModifyWriteOpResultObject<T | null>> & QueryHelpers;
  findOneAndUpdateWithDeleted(
    conditions: any,
    update: any,
    options: QueryFindOneAndUpdateOptions,
    callback?: (err: any, doc: T | null, res: any) => void,
  ): DocumentQuery<T | null, T> & QueryHelpers;
  // updateOne
  updateOneDeleted(
    conditions: any,
    doc: any,
    callback?: (err: any, raw: any) => void,
  ): Query<any> & QueryHelpers;
  updateOneDeleted(
    conditions: any,
    doc: any,
    options: ModelUpdateOptions,
    callback?: (err: any, raw: any) => void,
  ): Query<any> & QueryHelpers;
  updateOneWithDeleted(
    conditions: any,
    doc: any,
    callback?: (err: any, raw: any) => void,
  ): Query<any> & QueryHelpers;
  updateOneWithDeleted(
    conditions: any,
    doc: any,
    options: ModelUpdateOptions,
    callback?: (err: any, raw: any) => void,
  ): Query<any> & QueryHelpers;
  // updateMany
  updateManyDeleted(
    conditions: any,
    doc: any,
    callback?: (err: any, raw: any) => void,
  ): Query<any> & QueryHelpers;
  updateManyDeleted(
    conditions: any,
    doc: any,
    options: ModelUpdateOptions,
    callback?: (err: any, raw: any) => void,
  ): Query<any> & QueryHelpers;
  updateManyWithDeleted(
    conditions: any,
    doc: any,
    callback?: (err: any, raw: any) => void,
  ): Query<any> & QueryHelpers;
  updateManyWithDeleted(
    conditions: any,
    doc: any,
    options: ModelUpdateOptions,
    callback?: (err: any, raw: any) => void,
  ): Query<any> & QueryHelpers;
  // delete and restore
  delete(
    conditions: any,
    callback?: (err: any, raw: any) => void,
  ): Query<any> & QueryHelpers;
  restore(
    conditions: any,
    callback?: (err: any, raw: any) => void,
  ): Query<any> & QueryHelpers;
}

/**
 * Add a soft-delete hook. It can only be triggered by `delete` and `restore`
 * (including both class method and instance method), and is only visible to
 * `estimatedDocumentCount`, `countDocuments`, `find`, `findOne`,
 * `findOneAndUpdate`, `updateOne`, `updateMany` and their `*Deleted` and
 * `*WithDeleted` variants.
 *
 * @param schema {mongoose.Schema} schema to add soft-delete hook.
 */
export function addDeleted(schema: Schema): void {
  for (const method of [
    'estimatedDocumentCount',
    'countDocuments',
    'find',
    'findOne',
  ] as const ) {
    schema.statics[method] = function() {
      return Model[method]
        .apply(this, arguments as any)
        .where('deleted')
        .ne(true);
    };
    schema.statics[method + 'Deleted'] = function() {
      return Model[method]
        .apply(this, arguments as any)
        .where('deleted')
        .equals(true);
    };
    schema.statics[method + 'WithDeleted'] = function() {
      return Model[method].apply(this, arguments as any);
    };
  }
  for (const method of [
    'findOneAndUpdate',
    'updateOne',
    'updateMany',
  ] as const) {
    schema.statics[method] = function() {
      const args = parseUpdateArguments.apply(undefined, arguments as any);
      args[0] = args[0] || {};
      args[0].deleted = { $ne: true };
      return (Model[method] as any).apply(this, args);
    };
    schema.statics[method + 'Deleted'] = function() {
      const args = parseUpdateArguments.apply(undefined, arguments as any);
      args[0] = args[0] || {};
      args[0].deleted = { $eq: true };
      return (Model[method] as any).apply(this, args);
    };
    schema.statics[method + 'WithDeleted'] = function() {
      return (Model[method] as any).apply(this, arguments);
    };
  }
  schema.methods.delete = function() {
    this.deleted = true;
    return this.save();
  };
  schema.statics.delete = function(
    conditions: any,
    callback?: (err: any, raw: any) => void,
  ) {
    if (typeof conditions === 'function') {
      callback = conditions;
      conditions = {};
    }
    return this.updateManyWithDeleted(conditions, { deleted: true }, callback);
  };
  schema.methods.restore = function() {
    this.deleted = false;
    return this.save();
  };
  schema.statics.restore = function(
    conditions: any,
    callback?: (err: any, raw: any) => void,
  ) {
    if (typeof conditions === 'function') {
      callback = conditions;
      conditions = {};
    }
    return this.updateManyWithDeleted(conditions, { deleted: false }, callback);
  };
}

/**
 * Add a hook to schema to automatically delete file when no field refers to it.
 * This hook only work for `save` and `remove`, and you cannot call `save` and
 * `remove` multiple times.
 *
 * @param schema {mongoose.Schema} schema to add file fields hook.
 * @param fields {string[]} array of field names.
 * @param uploadDir {string} base directory for files.
 */
export function addFileFields(
  schema: Schema,
  fields: string[],
  uploadDir: string,
) {
  function errLogger(filename: string) {
    return (err: Error | null) => {
      if (err) {
        logger.error(`Failed to delete file "${filename}".`);
        logger.error(err);
      }
    };
  }
  schema.post('init', doc => {
    for (const field of fields) {
      // @ts-ignore
      doc['_' + field] = doc[field];
    }
  });
  schema.post('save', async doc => {
    for (const field of fields) {
      // @ts-ignore
      const oldFilename: string = doc['_' + field];
      try {
        // @ts-ignore
        if (oldFilename && oldFilename !== doc[field])
          await unlinkAsync(path.join(uploadDir, oldFilename));
      } catch (e) {
        errLogger(oldFilename)(e);
      }
    }
  });
  schema.post('remove', async doc => {
    for (const field of fields) {
      // @ts-ignore
      const oldFilename = doc['_' + field];
      try {
        // @ts-ignore
        if (oldFilename)
          await unlinkAsync(path.join(uploadDir, oldFilename));
      } catch (e) {
        errLogger(oldFilename)(e);
      }
    }
  });
}
