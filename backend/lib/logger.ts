import chalk from 'chalk';
import { environment, getLoggerDefaults } from '#backend/environment';
import { LogFormatEnum, type LogLevel } from '#backend/types/logger';
import { lazyObject } from '#blib/lazyObject';
import { Logger } from '#shared/logger/Logger';
import { ConsoleOutput } from '#shared/logger/outputs/ConsoleOutput';
import {
  ARGS,
  LEVEL,
  type LogRecord,
  MESSAGE,
  type TransformableEntry,
} from '#shared/logger/types';

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

const jsonRequest = (requestLevel: string, entry: TransformableEntry) => {
  if (entry[LEVEL] !== requestLevel) return entry;

  const request = entry.request as HTTPLogEntry;

  entry.message = `${request.method} ${request.url} ${request.statusCode}`;
  entry.http = request;
  delete entry.request;

  return entry;
};

const jsonCall = (callLevel: string, entry: TransformableEntry) => {
  if (entry[LEVEL] !== callLevel) return entry;

  const call = entry.request as TrpcLogEntry;

  entry.message = `${call.type} ${call.path} ${call.ok ? 'OK' : 'ERR'}`;
  entry.trpc = call;
  delete entry.request;

  return entry;
};

const StderrLevels: LogLevel[] = ['error', 'warn'];

const toSeverity = (
  severities: Record<LogLevel, string>,
  record: LogRecord,
) => {
  const { time, level, message, label, ...rest } = record;
  const severity = severities[level as LogLevel] ?? level;

  return {
    time,
    level: severity,
    message,
    ...(label === undefined ? {} : { label }),
    ...(severity === level ? {} : { kind: level }),
    ...rest,
  };
};

const jsonFallback = (entry: TransformableEntry) =>
  JSON.stringify({
    time: new Date().toISOString(),
    level: String(entry[LEVEL]),
    message: Logger.removeColors(String(entry[MESSAGE])),
    loggerError: 'Failed to format log entry',
  });

const LogSeverities: Record<LogLevel, string> = {
  error: 'error',
  warn: 'warn',
  info: 'info',
  http: 'info',
  trpc: 'info',
  verbose: 'debug',
  debug: 'debug',
  time: 'debug',
  logQuery: 'debug',
};

const prettyFormat = Logger.createOutputAssembler()
  .chain(prettyRequest.bind(null, 'http'))
  .chain(pretyCall.bind(null, 'trpc'))
  .chain(Logger.pretty);

const jsonFormat = Logger.createOutputAssembler()
  .chain(jsonRequest.bind(null, 'http'))
  .chain(jsonCall.bind(null, 'trpc'))
  .chain(Logger.toRecord)
  .chain(toSeverity.bind(null, LogSeverities))
  .chain(Logger.json.bind(null, { deterministic: false }));

function getLoggerConfig(): Pick<
  typeof environment,
  'LOG_LEVEL' | 'LOG_FORMAT'
> {
  try {
    return {
      LOG_LEVEL: environment.LOG_LEVEL,
      LOG_FORMAT: environment.LOG_FORMAT,
    };
  } catch {
    return getLoggerDefaults();
  }
}

function createLogger() {
  const { LOG_LEVEL: logLevel, LOG_FORMAT: logFormat } = getLoggerConfig();

  return new Logger({
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
        ...(logFormat === LogFormatEnum.JSON
          ? { format: jsonFormat, fallback: jsonFallback }
          : { format: prettyFormat }),
        level: logLevel,
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
    .registerLevelFunction(
      'logQuery',
      (log, query: string, _params: unknown[]) =>
        log(chalk.gray(`Query: ${query.trimEnd()}`)),
    ).logFunctions;
}

export const logger = lazyObject(createLogger);
