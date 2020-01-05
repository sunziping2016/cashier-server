/**
 * Server class for `app.js` to start and stop.
 *
 * @module src/server
 */
import {Client as Elastic} from '@elastic/elasticsearch';
import http from 'http';
import Koa, {DefaultContext, DefaultState} from 'koa';
import Router from 'koa-router';
import mongoose from 'mongoose';
import redis from 'redis';
// @ts-ignore
import redisCommands from 'redis-commands';
import {promisify} from 'util';
import apiRouter from './api';
import {Auth} from './core/protocol';
import koaLogger from './koaLogger';
import koaQs from './koaQs';
import Models from './models';
import {Jwt} from './models/jwt';
import {RBACModels, UserDocument} from './models/rbac';

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
  elastic: string;
  elasticIndexPrefix: string;
  mediaRoot: string;
  logLevel: string;
  cluster: number | boolean;
}

export interface InitialGlobal {
  config: ServerConfig;
  server: http.Server;
  db: mongoose.Mongoose;
  redis: redis.RedisClient;
  elastic: Elastic;
}

export interface CustomContextGlobal extends InitialGlobal, RBACModels {
  jwt: Jwt;
}

export interface CustomContext extends DefaultContext {
  global: CustomContextGlobal;
  params?: {[param: string]: string};
}

export interface CustomState extends DefaultState {
  auth?: Auth;
  mediaFiles?: string[];
  mediaDirs?: string[];
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
  public app?: Koa<CustomState, CustomContext>;

  /**
   * Start the server and initialize models and routes.
   *
   * @param config {object} configuration for project. see `config.example.json`
   *   for available options.
   */
  public async start(config: ServerConfig): Promise<void> {
    const app = this.app = new Koa<CustomState, CustomContext>();
    app.proxy = true;
    const db = await mongoose.connect(config.db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    const redisClient = redis.createClient(config.redis);
    const elasticClient = new Elastic({node: config.elastic});
    const server = http.createServer(app.callback());
    const initialGlobal: InitialGlobal = {
      config,
      db,
      redis: redisClient,
      elastic: elasticClient,
      server,
    };
    app.context.global = {
      ...initialGlobal,
      ...await Models(initialGlobal),
    };
    koaQs(app, {decoder: c => {
      try {
        return decodeURIComponent(c);
      } catch (e) {
        return c;
      }
    }});
    app.use(koaLogger);
    const router = new Router<CustomState, CustomContext>();
    const api = apiRouter(app.context.global);
    router.use('/api', api.routes(), api.allowedMethods());
    app.use(router.routes());
    app.use(router.allowedMethods());
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
      const {db, redis: redisClient, server} = this.app.context.global;
      await Promise.all([
        new Promise((resolve) => redisClient.quit(resolve)),
        new Promise(resolve => server.close(resolve)),
        db.disconnect(),
      ]);
    }
    mongoose.models = {};
  }
}
