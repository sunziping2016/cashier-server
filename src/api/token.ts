import Router from 'koa-router';
import {acquireTokenByUsername} from '../core/token';
import {CustomContext, CustomState} from '../Server';
import {coreToMiddleware} from './utils';

export default function tokenRouter(): Router<CustomState, CustomContext> {
  const router = new Router<CustomState, CustomContext>();
  router.post('/acquire-by-username', coreToMiddleware(acquireTokenByUsername));
  return router;
}
