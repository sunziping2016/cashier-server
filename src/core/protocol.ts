import {PermissionDocument, RoleDocument, UserDocument} from '../models/rbac';
import {CustomContextGlobal} from '../Server';

export class Auth {
  public readonly global: CustomContextGlobal;
  public readonly uid?: string;
  private permissions?: Set<string>;
  public constructor(global: CustomContextGlobal, payload?: {uid?: string}) {
    this.global = global;
    this.uid = payload && payload.uid;
  }
  public async updatePermissions() {
    let permissions: Array<[string, string]> = [];
    const defaultRole = await this.global.roles.findOne({name: 'default'})
      .select('roles')
      .populate({path: 'permissions', select: 'subject action'});
    if (defaultRole !== null) {
      permissions = permissions.concat(defaultRole.permissions
        .filter((permission: PermissionDocument) => permission !== null)
        .map((permission: PermissionDocument): [string, string] => [
          permission.subject, permission.action,
        ]));
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
        permissions = permissions.concat(...user.roles
          .filter((role: RoleDocument) => role !== null)
          .map((role: RoleDocument) => role.permissions
            .filter((permission: PermissionDocument) => permission !== null)
            .map((permission: PermissionDocument): [string, string] => [
              permission.subject, permission.action,
            ]),
          ),
        );
      }
    }
    this.permissions = new Set<string>();
    for (const permission of permissions)
      this.permissions.add(`${permission[0]}:${permission[1]}`);
  }
  public async hasPermission(subject: string, action: string)
    : Promise<boolean> {
    if (this.permissions === undefined)
      await this.updatePermissions();
    return this.permissions !== undefined
      && this.permissions.has(`${subject}:${action}`);
  }
}

export enum ErrorsEnum {
  OK = 200,
  SCHEMA = 400,
  INVALID = 400,
  PERMISSION = 400,
  AUTH = 401,
  EXIST = 404,
  PARSE = 422,
  INTERNAL = 500,
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
