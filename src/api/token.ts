import Router from 'koa-router';
import {acquireToken, resumeToken} from '../core/token';
import {CustomContext, CustomState} from '../Server';
import {coreToMiddleware} from './utils';

export default function tokenRouter(): Router<CustomState, CustomContext> {
  const router = new Router<CustomState, CustomContext>();
  router.post('/acquire', coreToMiddleware(acquireToken));
  router.post('/resume', coreToMiddleware(resumeToken));
  return router;
}
