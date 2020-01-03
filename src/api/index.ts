import fs from 'fs';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import rimraf from 'rimraf';
import logger from 'winston';
import {coreThrow} from '../core/errors';
import {Auth, ErrorsEnum} from '../core/protocol';
import {CustomContext, CustomContextGlobal, CustomState} from '../Server';
import tokenRouter from './token';

async function errorHandler(ctx: CustomContext, next: Koa.Next): Promise<void> {
  try {
    await next();
  } catch (err) {
    ctx.type = 'json';
    if (err.expose) {
      ctx.status = err.status || 500;
      ctx.body = JSON.stringify({
        code: ctx.status,
        message: err.message,
      });
    } else {
      ctx.status = 500;
      ctx.body = JSON.stringify({
        code: 500,
        message: 'Internal server error',
      });
      ctx.app.emit('error', err, ctx);
    }
  }
}

function cleanFiles(state: CustomState) {
  if (state.mediaFiles) {
    state.mediaFiles.forEach(file =>
      fs.unlink(file, err => {
        if (err) {
          logger.error(`Failed to delete file "${file}".`);
          logger.error(err);
        }
      }),
    );
  }
  if (state.mediaDirs) {
    state.mediaDirs.forEach(dir =>
      rimraf(dir, err => {
        if (err) {
          logger.error(`Failed to delete directory "${dir}".`);
          logger.error(err);
        }
      }),
    );
  }
}

export default function apiRouter(global: CustomContextGlobal)
  : Router<CustomState, CustomContext> {
  const router = new Router<CustomState, CustomContext>();
  const token = tokenRouter();
  router.use(errorHandler);
  router.use(bodyParser({
    onerror: (e, ctx) => {
      coreThrow(ErrorsEnum.PARSE, 'Cannot parse body');
    },
  }));
  router.use(async (ctx, next) => {
    ctx.state.mediaFiles = [];
    ctx.state.mediaDirs = [];
    ctx.state.auth = new Auth(global);
    const authorizationHeader: string | undefined = ctx.headers.authorization;
    if (authorizationHeader) {
      try {
        const splits = authorizationHeader.split(/\s+/);
        const jwt = splits[splits.length - 1];
        ctx.state.auth = new Auth(global, await ctx.global.jwt.verify(jwt));
      } catch (err) {
        ctx.set('WWW-Authenticate', 'Bearer');
        coreThrow(ErrorsEnum.AUTH, err.message);
      }
    }
    try {
      await next();
      if (ctx.status !== 200)
        cleanFiles(ctx.state);
    } catch (err) {
      cleanFiles(ctx.params);
      throw err;
    }
  });
  router.use('/token', token.routes(), token.allowedMethods());
  return router;
}
