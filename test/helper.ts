import path from 'path';
import SuperTest from 'supertest';
import logger from 'winston';
import Server from '../src/Server';

const server = new Server();
let config: any;

async function getConfig() {
  if (!config)
    config = await import(process.env.CASHIER_CONFIG_FILE
      ? path.join(__dirname, '..', process.env.CASHIER_CONFIG_FILE)
      : '../config/config.test.json');
  return config;
}

export async function startServer() {
  logger.configure({
    format: logger.format.combine(
      logger.format((info: any): any => {
        if (info instanceof Error)
          return Object.assign({}, info, { message: info.stack });
        return info;
      })(),
      logger.format.colorize(),
      logger.format.timestamp(),
      logger.format.printf(({ level, message, timestamp }) =>
        `${timestamp} ${level}: ${message}`),
    ),
    level: 'verbose',
    transports: [
      new (logger.transports.Console)({ silent: true }),
    ],
  });

  await getConfig();
  await server.start(config);
  if (server.app)
    return SuperTest(server.app.context.global.server);
}

export async function stopServer() {
  await server.stop();
}
