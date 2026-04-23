import chalk from 'chalk';
import { Logger } from '#shared/logger/Logger';
import { ConsoleOutput } from '#shared/logger/outputs/ConsoleOutput';
import {
  ARGS,
  LEVEL,
  MESSAGE,
  type TransformableEntry,
} from '#shared/logger/types';

export type RequestLogEntry = {
  type: string;
  path: string;
  ok: boolean;
  contentLength: number;
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

const colorPath = (url: string) => {
  const coloredSlash = chalk.bold.white('/');
  return url.replaceAll('.', coloredSlash);
};

const pretyCall = (requestLevel: string, entry: TransformableEntry) => {
  if (entry[LEVEL] !== requestLevel) {
    return entry;
  }

  const request = entry.request as RequestLogEntry;

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
  message += chalk.gray(' - ');
  message += chalk.cyan(chalk.bold.italic(request.contentLength), 'bytes');

  entry.message = message;

  return entry;
};

const prettyFormat = Logger.createOutputAssembler()
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
  },
  format: Logger.createFormatAssembler()
    .chain(colorStrings.bind(null, chalk.cyan))
    .chain(Logger.processArgs)
    .chain(Logger.processSplats)
    .chain(Logger.processError.bind(null, 'error'))
    .chain(Logger.addMetadata),
  outputs: [
    new ConsoleOutput({
      format: prettyFormat,
      level: ['error', 'warn', 'info', 'trpc', 'verbose', 'debug', 'time'],
    }),
  ],
})
  .registerLevelFunction(
    'trpc',
    (callback, level, request: RequestLogEntry) => {
      if (level !== 'trpc') {
        return;
      }

      callback({
        level,
        message: 'tRPC Request',
        request: Object.assign({}, request),
        [LEVEL]: level,
        [MESSAGE]: 'tRPC Request',
        [ARGS]: [],
      });
    },
  )
  .registerLevelFunction(
    'time',
    (
      callback,
      level,
      name: string,
      start: number,
      finish: number = performance.now(),
    ) => {
      if (level !== 'time') {
        return;
      }

      const message = chalk.gray`Timer ${name} took %o ${chalk.gray`ms`}`;

      callback({
        level,
        message,
        [LEVEL]: level,
        [MESSAGE]: message,
        [ARGS]: [Math.round((finish - start) * 1000) / 1000],
      });
    },
  );

export const logger = instance.logFunctions;
