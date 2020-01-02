/**
 * Server class for `app.js` to start and stop.
 *
 * @module src/server
 */
import http from 'http';
import Koa from 'koa';
import redis from 'redis';
// @ts-ignore
import redisCommands from 'redis-commands';
import { promisify } from 'util';
import koaLogger from './koaLogger';

redisCommands.list.forEach((key: string) => {
  redis.RedisClient.prototype[key + 'Async'] =
    promisify(redis.RedisClient.prototype[key]);
});
['exec', 'exec_atomic'].forEach((key) =>
  redis.Multi.prototype[key + 'Async'] = promisify(redis.Multi.prototype[key]),
);

export interface ServerConfig {
  host: string;
  port: number;
  site: string;
  db: string;
  redis: string;
  logLevel: string;
  cluster: number | boolean;
}

export interface CustomContextGlobal {
  config: ServerConfig;
  server: http.Server;
  redis: redis.RedisClient;
}

export interface CustomContext {
  global: CustomContextGlobal;
}

/**
 * Server class. In `start` method, it initialize the `global` object which is
 * passed between the modules inside this project.
 *
 * `global` object contains following member:
 *
 * 1. `config`: configuration for this project.
 * 2. `server`: node http server object
 *
 * koa middleware can access to the `global` object through `ctx.global`.
 */
export default class Server {
  public app?: Koa<{}, CustomContext>;

  /**
   * Start the server and initialize models and routes.
   *
   * @param config {object} configuration for project. see `config.example.json`
   *   for available options.
   */
  public async start(config: ServerConfig): Promise<void> {
    const app = this.app = new Koa();
    const server = http.createServer(app.callback());
    const redisClient = redis.createClient(config.redis);
    app.context.global = {
      config,
      redis: redisClient,
      server,
    };
    app.use(koaLogger);
    await new Promise((resolve, reject) =>
      server
        .listen(config.port, config.host, resolve)
        .once('error', reject),
    );
  }

  /**
   * Stop server. When server stopped, `start()` can be called again.
   */
  public async stop(): Promise<void> {
    if (this.app !== undefined) {
      const {server, redis: redisClient} = this.app.context.global;
      await Promise.all([
        new Promise((resolve, reject) => redisClient.quit(resolve)),
        new Promise(resolve => server.close(resolve)),
      ]);
    }
  }
}
