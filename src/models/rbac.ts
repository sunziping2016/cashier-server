/**
 * RBAC and user models, store the information and permission of all users.
 *
 * @module src/models/users
 */
import bcrypt from 'bcrypt';
// @ts-ignore
import mongoosastic from 'mongoosastic';
import mongoose from 'mongoose';
import {promisify} from 'util';
import logger from 'winston';
import {InitialGlobal} from '../Server';
import {
  addDeleted,
  AddDeletedDocument,
  AddDeletedModel,
  addFileFields,
} from './hooks';
import predefined from './rbacPredefined';

export interface PermissionDocument extends mongoose.Document {
  subject: string;
  action: string;
  displayName?: string;
  description?: string;
}

export interface RoleDocument extends mongoose.Document {
  name: string;
  permissions: Array<PermissionDocument['_id']>;
  displayName?: string;
  description?: string;
}

export interface UserDocument extends mongoose.Document, AddDeletedDocument {
  username: string;
  password: string;
  roles: Array<RoleDocument['_id']>;
  email?: string;
  nickname?: string;
  avatar: string;
  avatarThumbnail64: string;
  blocked?: boolean;
  deleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  checkPassword(password: string): Promise<boolean>;
}

export interface UserModel extends mongoose.Model<UserDocument>,
  AddDeletedModel<UserDocument> {
}

export interface RBACModels {
  permissions: mongoose.Model<PermissionDocument>;
  roles: mongoose.Model<RoleDocument>;
  users: UserModel;
}

type PredefinedPermissions = Array<[string, string, string?, string?]>;
type PredefinedRoles = Array<[string, Array<[string, string]>,
  string?, string?]>;
type PredefinedUsers = Array<[string, string, string[]]>;

export interface RBACPredefined {
  permissions: PredefinedPermissions;
  roles: PredefinedRoles;
  users: PredefinedUsers;
}

async function initPermissions(model: mongoose.Model<PermissionDocument>,
                               data: PredefinedPermissions)
  : Promise<void> {
  const permissions = data.map((permission) => {
    return {
      subject: permission[0],
      action: permission[1],
      displayName: permission[2],
      description: permission[3],
    };
  });
  await model.insertMany(permissions);
}

async function initRoles(permissionModel: mongoose.Model<PermissionDocument>,
                         roleModel: mongoose.Model<RoleDocument>,
                         data: PredefinedRoles)
  : Promise<void> {
  const roles = await Promise.all(data.map(async (role) => {
    return {
      name: role[0],
      permissions: await Promise.all(role[1].map(
        async (permission) => {
          const doc = await permissionModel.findOne({
            subject: permission[0],
            action: permission[1],
          });
          if (doc === null)
            throw new Error(`Cannot find the permission ` +
              `${permission[0]}.${permission[1]}`);
          return doc._id;
        },
      )),
      displayName: role[2],
      description: role[3],
    };
  }));
  await roleModel.insertMany(roles);
}

async function initUsers(roleModel: mongoose.Model<RoleDocument>,
                         userModel: mongoose.Model<UserDocument>,
                         data: PredefinedUsers)
  : Promise<void> {
  const users = await Promise.all(data.map(async (user) => {
    return {
      username: user[0],
      password: await bcrypt.hash(user[1], 10),
      roles: await Promise.all(user[2].map(async (role: string) => {
        const doc = await roleModel.findOne({ name: role });
        if (doc === null) {
          throw new Error(`Cannot find the role ${role}`);
        }
        return doc._id;
      })),
    };
  }));
  await userModel.insertMany(users);
}

export default async (initialGlobal: InitialGlobal): Promise<RBACModels> => {
  const {config, db, elastic} = initialGlobal;
  const listCollectionsAsync = promisify((callback: any) => {
    db.connection.db.listCollections().toArray(callback);
  });
  const collections: string[] = (await listCollectionsAsync() as any)
    .map((x: any) => x.name);
  /**
   * Available as `ctx.global.permissions`. Contains following fields:
   * - `subject`: subject of the permission. It should be a noun. Required.
   * - `action`: action of the permission. It should be a verb. Required.
   * - `displayName`: display name of the permission in Chinese.
   * - `description`: description of the permission in Chinese.
   * @class Permission
   */
  const permissionSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    action: { type: String, required: true },
    displayName: String,
    description: String,
  });
  permissionSchema.index({ subject: 1, action: 1 }, { unique: true });
  permissionSchema.plugin(mongoosastic, {
    esClient: elastic,
    index: config.elasticIndexPrefix + 'permissions',
    type: 'permission',
  });
  /**
   * Available as `ctx.global.roles`. Contains following fields:
   * - `name`: name of the role. Required.
   * - `permissions`: array of id pointing to `permissions` collection.
   * - `displayName`: display name of the role in Chinese.
   * - `description`: description of the role in Chinese.
   * @class Role
   */
  const roleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'permissions' }],
    displayName: String,
    description: String,
  });
  roleSchema.index({ name: 1 }, { unique: true });
  roleSchema.plugin(mongoosastic, {
    esClient: elastic,
    index: config.elasticIndexPrefix + 'roles',
    type: 'role',
  });
  const permissionModel = db.model<PermissionDocument>('permissions',
    permissionSchema);
  const roleModel = db.model<RoleDocument>('roles', roleSchema);
  if (collections.indexOf('permissions') === -1 && predefined.permissions) {
    logger.info('Initialize permissions database');
    await initPermissions(permissionModel, predefined.permissions);
    await new Promise((resolve, reject) => {
      const stream = permissionModel.synchronize();
      stream.on('close', resolve);
      stream.on('error', reject);
    });
  }
  if (collections.indexOf('roles') === -1 && predefined.roles) {
    logger.info('Initialize roles database');
    await initRoles(permissionModel, roleModel, predefined.roles);
    await new Promise((resolve, reject) => {
      const stream = roleModel.synchronize();
      stream.on('close', resolve);
      stream.on('error', reject);
    });
  }
  /**
   * Available as `ctx.global.users`. Contains following fields:
   * - `username`: String. Required. Should be unique for users who are not
   *   deleted.
   * - `password`: String. Required. `null` to disable authenticate.
   * - `roles`: array of id pointing to `roles` collection.
   * - `email`: String.
   * - `nickname`: String.
   * - `avatar`: String. Path to avatar. Automatically deleted old file.
   * - `avatarThumbnail64`: String. Path to avatar thumbnail.
   * - `blocked`: Boolean. Disable authenticate.
   * - `deleted`: Boolean. Automatic field.
   * @class User
   */
  const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'roles' }],
    email: String,
    nickname: String,
    avatar: String,
    avatarThumbnail64: String,
    blocked: Boolean,
    deleted: {type: Boolean, index: true},
  }, { timestamps: true });
  userSchema.index({ username: 1 }, {
    unique: true,
    partialFilterExpression: {
      deleted: false,
    },
  });
  userSchema.index({ email: 1 }, {
    unique: true,
    partialFilterExpression: {
      $and: [
        { email: { $exists: true } },
        { deleted: false },
      ],
    },
  });
  addDeleted(userSchema);
  addFileFields(userSchema, ['avatar', 'avatarThumbnail64'], config.mediaRoot);
  /**
   * Check whether password is okay.
   * @param password {string} password to check against.
   * @return {Promise.<boolean>} whether password is correct.
   * @function module:src/models/users~User#checkPassword
   */
  userSchema.methods.checkPassword = async function(password: string) {
    if (!this.password)
      return false;
    return bcrypt.compare(password, this.password);
  };
  userSchema.plugin(mongoosastic, {
    esClient: elastic,
    index: config.elasticIndexPrefix + 'users',
    type: 'user',
  });
  const userModel = db.model<UserDocument, UserModel>('users', userSchema);
  if (collections.indexOf('users') === -1 && predefined.users) {
    logger.info('Initialize users database');
    await initUsers(roleModel, userModel, predefined.users);
    await new Promise((resolve, reject) => {
      const stream = userModel.synchronize();
      stream.on('close', resolve);
      stream.on('error', reject);
    });
  }
  return {
    permissions: permissionModel,
    roles: roleModel,
    users: userModel,
  };
};
