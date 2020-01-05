import Ajv from 'ajv';
import bcrypt from 'bcrypt';
import {UserDocument} from '../models/rbac';
import {CustomContextGlobal} from '../Server';
import {
  coreAssert,
  coreOkay,
  corePermission,
  coreThrow,
  coreValidate,
} from './errors';
import {CoreRequest, CoreResponse, ErrorsEnum} from './protocol';
import {parse} from './query/parser';

const ajv = new Ajv();

const createUserSchema = ajv.compile({
  type: 'object',
  required: ['username', 'password', 'roles'],
  properties: {
    username: {type: 'string'},
    password: {type: 'string'},
    roles: {
      type: 'array',
      items: {
        type: 'string',
      },
      uniqueItems: true,
    },
  },
  additionalProperties: false,
});

export async function createUser(request: CoreRequest,
                                 global: CustomContextGlobal)
  : Promise<CoreResponse> {
  await corePermission(request.auth, 'user', 'create');
  const {post} = request;
  coreValidate(createUserSchema, post);
  const {users, roles} = global;
  const duplicatedUser = await users.findOne({username: post.username});
  coreAssert(duplicatedUser === null, ErrorsEnum.INVALID,
    'Username has been taken');
  const role = await Promise.all(post.roles.map(
    (r: string) => roles.findOne({name: r}).select('_id').exec()));
  // tslint:disable-next-line:no-console
  const index = role.findIndex((r: any) => r === null);
  coreAssert(index === -1, ErrorsEnum.INVALID,
    `Role ${post.roles[index]} does not exist`);
  const password = await bcrypt.hash(post.password, 10);
  const user = new users({
    username: post.username,
    password,
    roles: role.map((x: any) => x._id),
  });
  await user.save();
  const object = user.toObject();
  delete object.password;
  return {
    code: ErrorsEnum.CREATED,
    payload: object,
  };
}

export async function readUser(request: CoreRequest,
                               global: CustomContextGlobal)
  : Promise<CoreResponse> {
  const id = request.params && request.params.id;
  if (id === undefined)
    throw new Error('Cannot get id parameter');
  if (request.auth && request.auth.uid === id) {
    if (!(await request.auth.hasPermission('user', 'read') ||
      await request.auth.hasPermission('user', 'readSelf'))) {
      coreThrow(ErrorsEnum.FORBIDDEN,
        'Requires "read user" or "readSelf user" permission');
    }
  } else {
    await corePermission(request.auth, 'user', 'read');
  }
  const user = await global.users.findById(id);
  if (user === null)
    coreThrow(ErrorsEnum.NOT_FOUND, 'User does not exist');
  const object = user.toObject();
  delete object.password;
  return coreOkay(object);
}

const listUserSchema = ajv.compile({
  type: 'object',
  properties: {
    populate: {type: 'string', enum: ['false', 'true']},
    count: {type: 'string', enum: ['false', 'true']},
    filter: {
      type: 'object',
      properties: {
        search: {type: 'string'},
        username: {type: 'string'},
        email: {type: 'string'},
        role: {type: 'string'},
        blocked: {type: 'string', enum: ['true', 'false']},
      },
      additionalProperties: false,
    },
    limit: {type: 'string', pattern: '^\\d+$'},
    offset: {type: 'string', pattern: '^\\d+$'},
    sortBy: {type: 'string', enum: ['_id', 'username', 'email', 'nickname',
        'createdAt', 'updatedAt']},
    order: {type: 'string', enum: ['asc', 'desc']},
    lastId: {type: 'string', pattern: '[a-fA-F\\d]{24}'},
  },
  additionalProperties: false,
});

export async function listUsers(request: CoreRequest,
                                global: CustomContextGlobal)
  : Promise<CoreResponse> {
  await corePermission(request.auth, 'user', 'list');
  const get = request.get || {};
  return coreOkay(parse(get.query));
  // coreValidate(listUserSchema, get);
  // const filter: any = {};
  // if (get.filter) {
  //   if (get.filter.search !== undefined) {
  //     const search = get.filter.search
  //       .split(/\s+/).filter((x: string) => !!x)
  //       .map((x: string) =>
  //         new RegExp(x.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&'), 'i'));
  //     if (search.length !== 0) {
  //       filter.$or = filter.$or || [];
  //       search.forEach((x: RegExp) => {
  //         filter.$or.push({username: {$regex: x}});
  //         filter.$or.push({email: {$regex: x}});
  //       });
  //     }
  //   }
  //   if (get.filter.username !== undefined)
  //     filter.username = get.filter.username;
  //   if (get.filter.email !== undefined)
  //     filter.email = get.filter.email;
  //   if (get.filter.role !== undefined)
  //     filter.role = get.filter.role;
  //   if (get.filter.blocked !== undefined) {
  //     filter.blocked = get.filter.blocked === 'true' ? true : {$ne: true};
  //   }
  // }
  // const order = get.order || 'asc';
  // const limit = get.limit ? parseInt(get.limit, 10) : 10;
  // const offset = get.offset ? parseInt(get.offset, 10) : 0;
  // const sort: any = {};
  // const result: any = {};
  // if (get.sortBy === undefined || get.sortBy === '_id') {
  //   sort._id = order;
  //   if (get.lastId !== undefined) {
  //     filter._id = {[order === 'asc' ? '$gt' : '$lt']: get.lastId};
  //     result.lastId = filter.lastId;
  //   }
  // } else {
  //   sort[get.sortBy] = order;
  // }
  // const query = global.users.find(filter)
  //   .sort(sort)
  //   .limit(limit)
  //   .skip(offset);
  // if (get.populate !== 'true')
  //   query.select('_id');
  // result.data = await query;
  // if ((get.sortBy === undefined || get.sortBy === '_id') &&
  //   result.data.length !== 0) {
  //   result.lastId = result.data[result.data.length - 1]._id;
  // }
  // if (get.populate !== 'true')
  //   result.data = result.data.map((x: UserDocument) => x._id);
  // if (get.count === 'true') {
  //   delete filter._id;
  //   result.total = await global.users.count(filter);
  // }
  // return coreOkay(result);
}
