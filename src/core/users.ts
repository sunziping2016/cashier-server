import Ajv from 'ajv';
import bcrypt from 'bcrypt';
import {CustomContextGlobal} from '../Server';
import {
  coreAssert,
  coreOkay,
  corePermission,
  coreThrow,
  coreValidate,
} from './errors';
import {CoreRequest, CoreResponse, ErrorsEnum} from './protocol';

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
    code: ErrorsEnum.OK,
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
