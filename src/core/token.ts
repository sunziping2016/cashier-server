import Ajv from 'ajv';
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

const acquireTokenGetSchema = ajv.compile({
  type: 'object',
  required: ['method'],
  properties: {
    method: {enum: ['username', 'email']},
  },
  additionalProperties: false,
});

const acquireTokenByUsernameSchema = ajv.compile({
  type: 'object',
  required: ['username', 'password'],
  properties: {
    username: {type: 'string'},
    password: {type: 'string'},
  },
  additionalProperties: false,
});

const acquireTokenByEmailSchema = ajv.compile({
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {type: 'string'},
    password: {type: 'string'},
  },
  additionalProperties: false,
});

export async function acquireToken(request: CoreRequest,
                                   global: CustomContextGlobal)
  : Promise<CoreResponse> {
  const {get, post} = request;
  coreValidate(acquireTokenGetSchema, get);
  const search: {[key: string]: any} = {};
  if (get.method === 'username') {
    await corePermission(request.auth, 'token', 'acquireByUsername');
    coreValidate(acquireTokenByUsernameSchema, post);
    search.username = post.username;
  } else {
    await corePermission(request.auth, 'token', 'acquireByEmail');
    coreValidate(acquireTokenByEmailSchema, post);
    search.email = post.email;
  }
  const {jwt, users} = global;
  const user = await users.findOne(search);
  if (!user)
    coreThrow(ErrorsEnum.INVALID, 'User does not exist');
  coreAssert(await user.checkPassword(post.password), ErrorsEnum.INVALID,
    'Wrong password');
  coreAssert(user.blocked !== true, ErrorsEnum.INVALID, 'User blocked');
  const token = await jwt.sign({uid: user._id.toString()}, {
    expiresIn: '10d',
  });
  return coreOkay({token});
}

const resumeTokenSchema = ajv.compile({
  type: 'object',
  required: ['token'],
  properties: {
    token: {type: 'string'},
  },
  additionalProperties: false,
});

export async function resumeToken(request: CoreRequest,
                                  global: CustomContextGlobal)
  : Promise<CoreResponse> {
  const {post} = request;
  coreValidate(resumeTokenSchema, post);
  const {jwt, users} = global;
  let data: {uid: string, jti: string};
  try {
    data = await jwt.verify(post.token);
  } catch (e) {
    coreThrow(ErrorsEnum.INVALID, e.message);
  }
  await jwt.revoke(data.uid, data.jti);
  const user = await users.findById(data.uid);
  if (!user)
    coreThrow(ErrorsEnum.INVALID, 'User does not exist');
  coreAssert(user.blocked !== true, ErrorsEnum.INVALID, 'User blocked');
  const token = await jwt.sign({uid: user._id.toString()}, {
    expiresIn: '10d',
  });
  return coreOkay({token});
}
