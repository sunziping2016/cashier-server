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

const acquireTokenByUsernameSchema = ajv.compile({
  type: 'object',
  required: ['username', 'password'],
  properties: {
    username: {type: 'string'},
    password: {type: 'string'},
  },
  additionalProperties: false,
});

export async function acquireTokenByUsername(request: CoreRequest,
                                             global: CustomContextGlobal)
  : Promise<CoreResponse> {
  await corePermission(request.auth, 'token', 'acquireByUsername');
  const {post} = request;
  coreValidate(acquireTokenByUsernameSchema, post);
  const {jwt, users} = global;
  const user = await users.findOne({username: post.username});
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
