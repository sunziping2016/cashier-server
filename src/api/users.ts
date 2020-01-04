import Router from 'koa-router';
import {createUser, listUsers, readUser} from '../core/users';
import {CustomContext, CustomState} from '../Server';
import {coreToMiddleware} from './utils';

export default function usersRouter(): Router<CustomState, CustomContext> {
  const router = new Router<CustomState, CustomContext>();
  router.post('/', coreToMiddleware(createUser));
  router.get('/:id', coreToMiddleware(readUser));
  router.get('/', coreToMiddleware(listUsers));
  return router;
}
