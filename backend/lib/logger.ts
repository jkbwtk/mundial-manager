import chalk from 'chalk';
import { Logger } from '#shared/logger/Logger';
import { ConsoleOutput } from '#shared/logger/outputs/ConsoleOutput';
import { ARGS, LEVEL, type TransformableEntry } from '#shared/logger/types';

export type HTTPLogEntry = {
  method: string;
  remoteAddress: string;
  url: string;
  httpVersion: string;
  referer: string | null;
  userAgent: string | null;
  statusCode: number;
  statusMessage: string;
  contentLength: number;
  responseTime: number;
  totalTime: number;
};

export type TrpcLogEntry = {
  type: string;
  path: string;
  ok: boolean;
  responseTime: number;
};

export type QueryTimerData = {
  model?: string;
  operation: string;
  args: unknown;
};

const colorStrings = (color: typeof chalk.white, entry: TransformableEntry) => {
  const args = entry[ARGS].map((arg) => {
    if (typeof arg === 'string') {
      return color(arg);
    }
    return arg;
  });

  entry[ARGS] = args;

  return entry;
};

const colorUrl = (url: string) => {
  const coloredSlash = chalk.bold.white('/');
  return url.replaceAll('/', coloredSlash);
};

const colorPath = (url: string) => {
  const coloredSlash = chalk.bold.white('/');
  return url.replaceAll('.', coloredSlash);
};

const prettyRequest = (requestLevel: string, entry: TransformableEntry) => {
  if (entry[LEVEL] !== requestLevel) return entry;

  const request = entry.request as HTTPLogEntry;

  let message = '';

  message += `${chalk.bold.yellow(request.method)} ${chalk.bold.italic(`HTTP/${request.httpVersion}`)} ${colorUrl(request.url)}`;
  message += `${chalk.gray(' - ')}`;
  message += `${chalk.bold.italic(request.referer ?? '-')}`;
  message += `${chalk.gray(' - ')}`;
  message += `${chalk.blue.bold(request.statusCode)} ${chalk.blue.italic(request.statusMessage)}`;
  message += `${chalk.gray(' - ')}`;
  message += chalk.magenta(
    `resp: ${chalk.bold.italic(`${request.responseTime.toFixed(3)}ms`)} `,
  );
  message += chalk.magenta(
    `total: ${chalk.bold.italic(`${request.totalTime.toFixed(3)}ms`)}`,
  );
  message += `${chalk.gray(' - ')}`;
  message += chalk.cyan(`${chalk.bold.italic(request.contentLength)} bytes`);

  entry.message = message;
  delete entry.request;

  return entry;
};

const pretyCall = (requestLevel: string, entry: TransformableEntry) => {
  if (entry[LEVEL] !== requestLevel) {
    return entry;
  }

  const request = entry.request as TrpcLogEntry;

  let message = '';

  message += chalk.bold.yellow(request.type.toUpperCase());
  message += ` ${colorPath(request.path)}`;
  message += chalk.gray(' - ');
  message += chalk.blue.bold(request.ok ? 'OK' : 'ERR');
  message += chalk.gray(' - ');
  message += chalk.magenta(
    'total:',
    chalk.bold.italic(request.responseTime.toFixed(3)),
    'ms',
  );

  entry.message = message;
  delete entry.request;

  return entry;
};

const StderrLevels = ['error', 'warn'];

const prettyFormat = Logger.createOutputAssembler()
  .chain(prettyRequest.bind(null, 'http'))
  .chain(pretyCall.bind(null, 'trpc'))
  .chain(Logger.pretty);

const instance = new Logger({
  levels: {
    error: {
      level: 0,
      color: 'red',
    },
    warn: {
      level: 1,
      color: 'yellow',
    },
    info: {
      level: 2,
      color: 'green',
    },
    http: {
      level: 3,
      color: 'gray',
    },
    trpc: {
      level: 3,
      color: 'gray',
    },
    verbose: {
      level: 4,
      color: 'cyan',
    },
    debug: {
      level: 5,
      color: 'blue',
    },
    time: {
      level: 6,
      color: 'gray',
    },
    logQuery: {
      level: 8,
      color: 'gray',
    },
  },
  format: Logger.createFormatAssembler()
    .chain(colorStrings.bind(null, chalk.cyan))
    .chain(Logger.processArgs)
    .chain(Logger.processSplats)
    .chain(Logger.processError)
    .chain(Logger.addMetadata),
  outputs: [
    new ConsoleOutput({
      format: prettyFormat,
      level: [
        'error',
        'warn',
        'info',
        'http',
        'trpc',
        'verbose',
        'debug',
        'time',
        'logQuery',
      ],
      stderrLevels: StderrLevels,
    }),
  ],
})
  .registerLevelFunction('http', (log, request: HTTPLogEntry) =>
    log('HTTP Request', { request: { ...request } }),
  )
  .registerLevelFunction('trpc', (log, request: TrpcLogEntry) =>
    log('tRPC Request', { request: { ...request } }),
  )
  .registerLevelFunction(
    'time',
    (log, name: string, start: number, finish: number = performance.now()) =>
      log(
        chalk.gray(`Timer ${name} took %o ms`),
        Math.round((finish - start) * 1000) / 1000,
      ),
  )
  .registerLevelFunction('logQuery', (log, query: string, _params: unknown[]) =>
    log(chalk.gray(`Query: ${query.trimEnd()}`)),
  );

export const logger = instance.logFunctions;
