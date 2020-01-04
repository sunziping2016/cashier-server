import {PermissionDocument, RoleDocument} from '../models/rbac';
import {CustomContextGlobal} from '../Server';

export interface AuthData {
  permissions: Set<string>;
  permissionIds: string[];
  roleIds: string[];
}

export class Auth {
  public readonly global: CustomContextGlobal;
  public readonly uid?: string;
  public data?: AuthData;
  public constructor(global: CustomContextGlobal, payload?: {uid?: string}) {
    this.global = global;
    this.uid = payload && payload.uid;
  }
  public async updatePermissions() {
    let permissions: Array<[string, string, string]> = [];
    let roles: string[] = [];
    const defaultRole = await this.global.roles.findOne({name: 'default'})
      .select('roles')
      .populate({path: 'permissions', select: 'subject action'});
    if (defaultRole !== null) {
      permissions = permissions.concat(defaultRole.permissions
        .filter((permission: PermissionDocument) => permission !== null)
        .map((permission: PermissionDocument): [string, string, string] => [
          permission._id, permission.subject, permission.action,
        ]));
      roles.push(defaultRole._id);
    }
    if (this.uid !== undefined) {
      const user = await this.global.users.findOne({
        _id: this.uid,
      }).select('roles').populate({
        path: 'roles',
        select: 'permissions',
        populate: {
          path: 'permissions',
          select: 'subject action',
        },
      });
      if (user !== null) {
        const nonNullRoles = user.roles
          .filter((role: RoleDocument) => role !== null);
        roles = roles.concat(nonNullRoles
          .map((role: RoleDocument) => role._id));
        permissions = permissions.concat(...nonNullRoles
          .map((role: RoleDocument) => role.permissions
            .filter((permission: PermissionDocument) => permission !== null)
            .map((permission: PermissionDocument): [string, string, string] => [
              permission._id, permission.subject, permission.action,
            ]),
          ),
        );
      }
    }
    this.data = {
      permissions: new Set<string>(),
      permissionIds: [],
      roleIds: roles,
    };
    for (const permission of permissions) {
      this.data.permissionIds.push(permission[0]);
      this.data.permissions.add(`${permission[1]}:${permission[2]}`);
    }
  }
  public async hasPermission(subject: string, action: string)
    : Promise<boolean> {
    if (this.data === undefined)
      await this.updatePermissions();
    return this.data !== undefined
      && this.data.permissions.has(`${subject}:${action}`);
  }
}

export enum ErrorsEnum {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  SCHEMA = 400,
  INVALID = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  PARSE = 422,
  INTERNAL = 500,
  NOT_IMPLEMENTED = 501,
}

export interface CoreRequest {
  transport: 'ajax' | 'websocket';
  ip?: string;
  auth?: Auth;
  params?: {[param: string]: string};
  get?: any;
  post?: any;
}

export interface CoreResponse {
  code: ErrorsEnum;
  payload?: any;    // on success
  message?: string; // on failure
}
