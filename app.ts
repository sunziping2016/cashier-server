import cluster from 'cluster';
import program from 'commander';
import os from 'os';
import logger from 'winston';
import Server, {ServerConfig} from './src/Server';

let port: string | undefined;
let host: string | undefined;

async function main() {
  // Process command line option
  program.version('0.1.0')
    .arguments('[port [host]]')
    .action((p?: string, h?: string): void => {
      port = p;
      host = h;
    })
    .option('-c, --config <file>', 'config file to load',
      process.env.CASHIER_CONFIG_FILE || './config/config.json')
    .option('-j, --cluster [num]', 'whether to use cluster',
      x => parseInt(x, 10))
    .option('-v, --verbose', 'show verbose information')
    .parse(process.argv);
  const customConfig = await import(program.config);

  const config: ServerConfig = {
    host: 'localhost',
    port: 8000,
    site: '',
    logLevel: 'info',
    cluster: false,
    ...customConfig,
  };

  // Process configuration
  if (port !== undefined)
    config.port = parseInt(port, 10);
  if (host !== undefined)
    config.host = host;
  if (program.cluster !== undefined)
    config.cluster = program.cluster;
  if (program.verbose)
    config.logLevel = 'verbose';
  if (config.cluster === true)
    config.cluster = os.cpus().length;
  if (!config.site)
    config.site = `http://${config.host}:${config.port}`;

  // Process log
  const logLabel = (config.cluster ? (cluster.isMaster ? 'Master' : 'Worker')
    : 'Main') + ' ' + process.pid;
  logger.configure({
    format: logger.format.combine(
      logger.format((info: any): any => {
        if (info instanceof Error)
          return Object.assign({}, info, { message: info.stack });
        return info;
      })(),
      logger.format.colorize(),
      logger.format.label({ label: logLabel }),
      logger.format.timestamp(),
      logger.format.printf(({ level, message, label, timestamp }) =>
        `${timestamp} [${label}] ${level}: ${message}`),
    ),
    level: config.logLevel,
    transports: [
      new (logger.transports.Console)(),
    ],
  });

  // Run server
  if (config.cluster) {
    if (cluster.isMaster) {
      logger.info(`Master starts at http://${config.host}:${config.port}`);
      for (let i = 0; i < config.cluster; ++i)
        cluster.fork();

      let confirmed = false;
      cluster.on('exit', (worker, code) => {
        if (!worker.exitedAfterDisconnect)
          logger.error(`Worker ${worker.process.pid} exited accidentally ` +
            `with code ${code}`);
      });

      process.on('SIGINT', () => {
        if (confirmed) {
          logger.warn('Received SIGINT again. Force stop!');
          process.exit(1);
        } else {
          logger.info('Received SIGINT. ' +
            'Press CTRL-C again in 5s to force stop.');
          confirmed = true;
          setTimeout(() => confirmed = false, 5000).unref();
        }
      });
    } else if (cluster.isWorker) {
      const server = new Server();
      server.start(config)
        .then(() => logger.info('Worker starts'))
        .catch((err: Error): void => {
          logger.error('Error when starting worker');
          logger.error(err);
        });

      process.on('SIGINT', () => {
        cluster.worker.disconnect();
        server.stop()
          .then(() => {
            logger.info('Worker stops');
            process.exit();
          })
          .catch((err: Error): void => {
            logger.error('Error when stopping worker');
            logger.error(err);
          });
      });
    }
  } else {
    const server = new Server();
    server.start(config)
      .then(() => logger.info(`Server starts at ` +
        `http://${config.host}:${config.port}`))
      .catch((err: Error): void => {
        logger.error('Error when starting server');
        logger.error(err);
      });

    let confirmed = false;
    process.on('SIGINT', () => {
      if (confirmed) {
        logger.warn('Received SIGINT again. Force stop!');
        process.exit(1);
      } else {
        logger.info('Received SIGINT. Press CTRL-C again in 5s to force stop.');
        confirmed = true;
        setTimeout(() => confirmed = false, 5000).unref();
        server.stop()
          .then(() => logger.info('Server stops'))
          .catch((err: Error): void => {
            logger.error('Error when stopping server');
            logger.error(err);
          });
      }
    });
  }
}

main().catch(x => {
  // tslint:disable-next-line:no-console
  console.error(x);
});

