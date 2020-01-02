/**
 * Koa logging tool.
 *
 * @module src/koa-logger
 */
import chalk from 'chalk';
import Koa from 'koa';
import logger from 'winston';

enum STATUS_COLORS {
  error = 'red',
  warn = 'yellow',
  info = 'green',
}

/**
 * Koa benchmark middleware. It will print processing duration and status
 * code.
 *
 * @param ctx {Koa.Context} Koa context.
 * @param next {function} Koa next.
 */
export default async function koaLogger(ctx: Koa.Context,
                                        next: () => Promise<any>)
  : Promise<void> {
  const start = +new Date();
  let status = 500;
  try {
    await next();
    status = ctx.status;
  } catch (err) {
    status = err.status || 500;
    throw err;
  } finally {
    const duration: number = +new Date() - start;
    let logLevel: 'error' | 'warn' | 'info';
    if (status >= 500)
      logLevel = 'error';
    else if (status >= 400)
      logLevel = 'warn';
    else
      logLevel = 'info';
    const msg = chalk.gray(`${ctx.method} ${ctx.originalUrl}`) +
      chalk[STATUS_COLORS[logLevel]](` ${status} `) +
      chalk.gray(`${duration}ms`);
    logger.log(logLevel, msg);
  }
}
