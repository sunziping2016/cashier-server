import {CoreRequest, CoreResponse} from '../core/protocol';
import {CustomContext, CustomContextGlobal, CustomState} from '../Server';

export function coreToMiddleware(func: (request: CoreRequest,
                                        global: CustomContextGlobal)
  => Promise<CoreResponse>)
  : (ctx: CustomContext & {state: CustomState}) => Promise<void> {
  return async function createUser(ctx) {
    const request: CoreRequest = {
      transport: 'ajax',
      ip: ctx.ip,
      auth: ctx.state.auth,
      params: ctx.params,
      get: ctx.query,
      post: ctx.request.body,
    };
    const result = await func(request, ctx.global);
    if (result !== undefined)
      ctx.body = result;
  };
}
