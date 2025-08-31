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
  method: string;
  url: string;
  statusCode: number;
  statusMessage: string;
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

const colorUrl = (url: string) => {
  const coloredSlash = chalk.bold.white('/');
  return url.replaceAll('/', coloredSlash);
};

const prettyRequest = (requestLevel: string, entry: TransformableEntry) => {
  if (entry[LEVEL] !== requestLevel) {
    return entry;
  }

  const request = entry.request as RequestLogEntry;

  let message = '';

  message += `${chalk.bold.yellow(request.method)} ${colorUrl(request.url)}`;
  message += `${chalk.gray(' - ')}`;
  message += `${chalk.blue.bold(request.statusCode)} ${chalk.blue.italic(request.statusMessage)}`;
  message += `${chalk.gray(' - ')}`;
  message += chalk.magenta`total: ${chalk.bold.italic`${request.responseTime.toFixed(3)}ms`}`;
  message += `${chalk.gray(' - ')}`;
  message += chalk.cyan`${chalk.bold.italic(request.contentLength)} bytes`;

  entry.message = message;

  return entry;
};

const prettyFormat = Logger.createOutputAssembler()
  .chain(prettyRequest.bind(null, 'http'))
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
    queryTime: {
      level: 7,
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
    .chain(Logger.processError.bind(null, 'error'))
    .chain(Logger.addMetadata),
  outputs: [
    new ConsoleOutput({
      format: prettyFormat,
      level: [
        'error',
        'warn',
        'info',
        'http',
        'verbose',
        'debug',
        'time',
        'queryTime',
        'logQuery',
      ],
    }),
    // new WebhookOutput({
    //   format: prettyFormat.copy().chain(Logger.removeColors),
    //   level: ['error', 'info'],
    // }),
    // new ConsoleOutput({
    //   format: fileJsonFormat,
    //   level: Number.POSITIVE_INFINITY,
    // }),
    // new FileOutput({
    //   format: fileJsonFormat,
    //   level: Number.POSITIVE_INFINITY,
    //   filename: 'combined_json.log',
    //   directory: 'logs',
    //   rotationFormat: FileOutput.rotateDate,
    //   maxAge: dayjs.duration({ days: 7 }),
    // }),
    // new FileOutput({
    //   format: fileJsonFormat,
    //   level: ['error', 'warn'],
    //   filename: 'important_json.log',
    //   directory: 'logs',
    //   rotationFormat: FileOutput.rotateDate,
    // }),
    // new FileOutput({
    //   format: prettyFormat.copy().chain(Logger.removeColors),
    //   level: ['error', 'warn'],
    //   filename: 'important_human.log',
    //   directory: 'logs',
    //   rotationFormat: FileOutput.rotateDate,
    // }),
    // new FileOutput({
    //   format: prettyFormat.copy().chain(Logger.removeColors),
    //   level: Number.POSITIVE_INFINITY,
    //   filename: 'combined_human.log',
    //   directory: 'logs',
    //   rotationFormat: FileOutput.rotateDate,
    //   maxFiles: 5,
    // }),
  ],
})
  .registerLevelFunction(
    'http',
    (callback, level, request: RequestLogEntry) => {
      if (level !== 'http') {
        return;
      }

      callback({
        level,
        message: 'HTTP Request',
        request: Object.assign({}, request),
        [LEVEL]: level,
        [MESSAGE]: 'HTTP Request',
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
  )
  .registerLevelFunction(
    'queryTime',
    (
      callback,
      level,
      data: QueryTimerData,
      start: number,
      finish: number = performance.now(),
    ) => {
      if (level !== 'queryTime') {
        return;
      }

      const message = chalk.gray`Query ${data.model ?? '[MODEL]'}.${chalk.bold(data.operation)} took %o ${chalk.gray`ms`}`;

      callback({
        level,
        message,
        data: Object.assign({}, data),
        [LEVEL]: level,
        [MESSAGE]: message,
        [ARGS]: [Math.round((finish - start) * 1000) / 1000],
      });
    },
  )
  .registerLevelFunction(
    'logQuery',
    (callback, level, query: string, _params: unknown[]) => {
      if (level !== 'logQuery') {
        return;
      }

      const message = chalk.gray`Query: ${query.trimEnd()}`;

      callback({
        level,
        message,
        [LEVEL]: level,
        [MESSAGE]: message,
        [ARGS]: [],
      });
    },
  );

export const logger = instance.logFunctions;
