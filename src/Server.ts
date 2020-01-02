/**
 * Server class for `app.js` to start and stop.
 *
 * @module src/server
 */
import http from 'http';
import Koa from 'koa';
import koaLogger from './koaLogger';

export interface ServerConfig {
  host: string;
  port: number;
  site: string;
  logLevel: string;
  cluster: number | boolean;
}

export interface CustomContextGlobal {
  config: ServerConfig;
  server: http.Server;
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
    app.context.global = {
      config,
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
      const {server} = this.app.context.global;
      await Promise.all([
        new Promise((resolve, reject) => server.close(resolve)),
      ]);
    }
  }
}
