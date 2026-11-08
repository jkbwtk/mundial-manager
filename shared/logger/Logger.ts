import EventEmitter from 'node:events';
import { formatWithOptions, inspect } from 'node:util';
import colors from '@colors/colors/safe';
import chalk from 'chalk';
import { configure as configureStringify } from 'safe-stable-stringify';
import z from 'zod';
import { Assembler } from '#shared/Assembler';
import { ConsoleOutput } from '#shared/logger/outputs/ConsoleOutput';
import {
  type AllowedLoggerTypes,
  ARGS,
  type DefaultLoggerOptions,
  type JsonOptions,
  LEVEL,
  type LevelLogEntry,
  type LevelLogFunction,
  type LogCallback,
  type LogEntry,
  type LogError,
  type LoggerLevelMethods,
  type LoggerMethods,
  type LoggerOptions,
  type LogLevel,
  type LogLevels,
  type LogRecord,
  MESSAGE,
  type MergedOptions,
  type OmitMetadata,
  type TransformableEntry,
} from '#shared/logger/types';
import { arrayFrom, quickSwitch } from '#shared/utils';

export declare interface Logger<
  T extends Partial<LoggerOptions> = DefaultLoggerOptions,
> {
  on(event: 'log', listener: (entry: TransformableEntry) => void): this;

  defaultLogFunction(callback: LogCallback, entry: LogEntry<T>): void;
  defaultLogFunction(
    callback: LogCallback,
    level: keyof MergedOptions<T>['levels'],
    message: string,
    ...args: AllowedLoggerTypes<T>[]
  ): void;
  defaultLevelFunction(
    callback: LogCallback,
    level: keyof MergedOptions<T>['levels'],
    message: string,
    ...args: AllowedLoggerTypes<T>[]
  ): void;
  defaultLevelFunction(
    callback: LogCallback,
    level: keyof MergedOptions<T>['levels'],
    entry: LogEntry<T>,
  ): void;
}

const CoreFields = new Set([
  'level',
  'message',
  'label',
  'error',
  'time',
  'runtime',
  'pid',
]);

const MAX_CAUSE_DEPTH = 5;

// biome-ignore lint/suspicious/noUnsafeDeclarationMerging: it's what it's
export class Logger<
  T extends Partial<LoggerOptions> = DefaultLoggerOptions,
  F = LoggerMethods<T>,
> extends EventEmitter {
  public static readonly defaultOptions = {
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
    },
    format: Logger.createFormatAssembler()
      .chain(Logger.processArgs)
      .chain(Logger.processSplats),
    outputs: [
      new ConsoleOutput({
        format: Logger.createOutputAssembler().chain(Logger.pretty),
        level: 'debug',
      }),
    ],
  } satisfies LoggerOptions;

  public readonly options: MergedOptions<T>;

  public logFunctions: F;

  constructor(options?: T) {
    super();

    this.options = this.mergeOptions(options) as MergedOptions<T>;

    this.logFunctions = this.createDefaultLogFunctions();
  }

  private mergeOptions(options: T | undefined): LoggerOptions {
    if (options === undefined) {
      return Logger.defaultOptions;
    }

    const merged = {
      levels: options.levels ?? Logger.defaultOptions.levels,
      format: options.format ?? Logger.defaultOptions.format,
      outputs: options.outputs ?? Logger.defaultOptions.outputs,
    } satisfies LoggerOptions;

    return merged;
  }

  private copy(): Logger<T, F> {
    const ctx = new Logger<T, F>({ ...this.options });

    ctx.logFunctions = { ...this.logFunctions };

    return ctx;
  }

  public static createFormatAssembler(): Assembler<
    TransformableEntry,
    LoggerOptions
  > {
    return new Assembler<TransformableEntry, LoggerOptions>();
  }

  public static createOutputAssembler(): Assembler<
    TransformableEntry,
    LoggerOptions
  > {
    return new Assembler<TransformableEntry, LoggerOptions>();
  }

  public static getLevelSettings(
    context: LoggerOptions,
    entry: TransformableEntry,
  ): LogLevel | null {
    if (context.levels === undefined) {
      return null;
    }
    return context.levels[entry[LEVEL] as keyof LogLevels] ?? null;
  }

  public getContext(): MergedOptions<T> {
    return this.options;
  }

  public static getColor(
    context: LoggerOptions,
    entry: TransformableEntry,
  ): typeof chalk.white {
    const levelSettings = Logger.getLevelSettings(context, entry);

    if (levelSettings === null) {
      return chalk.white;
    }
    if (typeof levelSettings.color !== 'string') {
      return levelSettings.color;
    }

    return quickSwitch(levelSettings.color, {
      white: chalk.white,
      gray: chalk.gray,
      yellow: chalk.yellow,
      red: chalk.red,
      green: chalk.green,
      cyan: chalk.cyan,
      blue: chalk.blue,
      magenta: chalk.magenta,
      black: chalk.black,
      default: chalk.white,
    });
  }

  private logCallback(entry: TransformableEntry): void {
    const assembled = this.options.format.assemble(entry, this.getContext());

    if (assembled === null) {
      for (const output of this.options.outputs) {
        output.logFallback(this.getContext(), entry);
      }

      return;
    }

    this.emit('log', assembled);

    for (const output of this.options.outputs) {
      output.log(this.getContext(), assembled);
    }
  }

  public registerLevelFunction<
    K extends keyof LoggerLevelMethods<T>,
    P extends (log: LevelLogFunction<T>, ...args: never[]) => void,
  >(level: K, func: P): Logger<T, Omit<F, K> & Record<K, OmitMetadata<P>>> {
    const ctx = this.copy() as Logger<
      T,
      Omit<F, K> & Record<K, OmitMetadata<P>>
    >;

    const log = ctx.defaultLevelFunction.bind(
      ctx,
      ctx.logCallback.bind(ctx),
      level,
    ) as LevelLogFunction<T>;

    ctx.logFunctions[level] = ((...args: never[]) =>
      func(log, ...args)) as (Omit<F, K> & Record<K, OmitMetadata<P>>)[K];

    return ctx;
  }

  private createDefaultLogFunctions(): F {
    const functions: F = {
      log: this.defaultLogFunction.bind(this, this.logCallback.bind(this)),
    } as F;

    for (const level of Object.keys(this.options.levels)) {
      functions[level as keyof F] = this.defaultLevelFunction.bind(
        this,
        this.logCallback.bind(this),
        level as keyof LoggerLevelMethods<T>,
      ) as F[keyof F];
    }

    return functions;
  }

  public defaultLogFunction(
    callback: LogCallback,
    entry: LogEntry<T> | keyof LoggerLevelMethods<T>,
    arg?: AllowedLoggerTypes<T>,
    ...args: AllowedLoggerTypes<T>[]
  ): void {
    const level = typeof entry === 'object' ? entry.level : entry;
    const argsArray: AllowedLoggerTypes<T>[] = [];
    let message: string;

    if (typeof entry === 'object') {
      message = entry.message;
    } else if (typeof arg === 'string') {
      message = arg;
    } else {
      message = `${arg}`;
    }

    if (typeof entry === 'object' && entry.args !== undefined) {
      argsArray.push(...entry.args);
    }

    argsArray.push(...args);

    const transformed: TransformableEntry = {
      level,
      message,
      [LEVEL]: level,
      [MESSAGE]: message,
      [ARGS]: argsArray,
    };

    callback(transformed);
  }

  public defaultLevelFunction(
    callback: LogCallback,
    level: keyof LoggerLevelMethods<T>,
    entry: LevelLogEntry<T> | string,
    ...args: AllowedLoggerTypes<T>[]
  ): void {
    const argsArray: AllowedLoggerTypes<T>[] = [];
    let message: string;

    let newEntry: Partial<LevelLogEntry<T>> = {};

    if (typeof entry === 'string') {
      newEntry.message = entry;
      message = entry;
    } else {
      newEntry = { ...entry };
      message = entry.message;
    }

    if (typeof entry === 'object' && entry.args !== undefined) {
      argsArray.push(...entry.args);
    }

    argsArray.push(...args);

    const transformed: TransformableEntry = {
      level,
      message,
      ...newEntry,
      [LEVEL]: level,
      [MESSAGE]: message,
      [ARGS]: argsArray,
    };

    callback(transformed);
  }

  public static processArgs(
    entry: TransformableEntry,
    _context: LoggerOptions,
  ): TransformableEntry {
    const tokens = entry.message.match(/%[sdifjoc]/g);
    if (!tokens) {
      return entry;
    }

    const args = entry[ARGS];

    if (args.length === 0) {
      return entry;
    }

    const templateArgs = args.slice(0, tokens.length);
    const extraArgs = args.slice(tokens.length);

    entry[ARGS] = extraArgs;

    entry.message = formatWithOptions(
      {
        colors: chalk.level > 0,
        depth: 3,
        breakLength: Number.POSITIVE_INFINITY,
      },
      entry.message,
      ...templateArgs,
    );

    return entry;
  }

  public static processSplats(
    entry: TransformableEntry,
    _context: LoggerOptions,
  ): TransformableEntry {
    const message = entry.message;

    for (const arg of entry[ARGS]) {
      if (arg instanceof Error) {
        entry.error ??= arg;

        continue;
      }

      if (typeof arg === 'object' && arg !== null) {
        const {
          message: _message,
          level: _level,
          ...fields
        } = arg as Record<string, unknown>;

        Object.assign(entry, fields);
      }
    }

    entry.message = message;

    return entry;
  }

  public static processError(
    entry: TransformableEntry,
    _context: LoggerOptions,
  ): TransformableEntry {
    if (entry.error !== undefined) {
      entry.error = Logger.normalizeError(entry.error);
    }

    return entry;
  }

  public static normalizeError(error: unknown, depth = 0): LogError {
    if (error instanceof z.ZodError) {
      return {
        type: 'ZodError',
        message: z.prettifyError(error),
        issues: error.issues,
      };
    }

    if (typeof error === 'string') {
      return { type: 'Error', message: error };
    }

    if (!(error instanceof Error)) {
      return {
        type:
          typeof error === 'object' && error !== null ? 'Object' : typeof error,
        message: inspect(error, {
          depth: 3,
          breakLength: Number.POSITIVE_INFINITY,
        }),
      };
    }

    const { name, message, stack, cause, ...fields } = error as Error & {
      cause?: unknown;
    };

    return {
      type: name,
      message,
      stack,
      ...fields,
      ...(cause === undefined || depth >= MAX_CAUSE_DEPTH
        ? {}
        : { cause: Logger.normalizeError(cause, depth + 1) }),
    };
  }

  public static getFields(entry: TransformableEntry): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(entry).filter(([key]) => !CoreFields.has(key)),
    );
  }

  public static formatError(error: LogError): string {
    const { type, message, stack, cause, ...fields } = error;
    const frames = stack?.split('\n').slice(1).join('\n');

    let text = chalk.red.bold(`${type}: ${message}`);

    if (frames) {
      text += `\n${chalk.red.italic(frames)}`;
    }

    if (Object.keys(fields).length > 0) {
      text += `\n${inspect(fields, { colors: chalk.level > 0, depth: 3 })}`;
    }

    if (cause !== undefined) {
      text += `\n${chalk.red('Caused by')} ${Logger.formatError(cause)}`;
    }

    return text;
  }

  public static addMetadata(
    entry: TransformableEntry,
    _context: LoggerOptions,
  ): TransformableEntry {
    entry.time = new Date().toISOString();
    entry.runtime = process.uptime();
    entry.pid = process.pid;

    return entry;
  }

  public static removeColors(message: string): string {
    return colors.strip(message).replace(/\\u001b\[[\d;]+m/g, '');
  }

  public static pretty(
    entry: TransformableEntry,
    context: LoggerOptions,
  ): string {
    const color = Logger.getColor(context, entry);
    const coloredLevel = color.bold(String(entry.level).toUpperCase());

    let message = '';

    if (typeof entry.runtime === 'number') {
      message += `[${chalk.gray(entry.runtime.toFixed(3))}]`;
    }

    if (typeof entry.time === 'string') {
      message += `[${chalk.gray(entry.time)}]`;
    }

    message += `[${coloredLevel}]`;

    if (typeof entry.label !== 'undefined') {
      const labels = arrayFrom(entry.label).map((label) => color(label));
      message += `[${labels.join(':')}]`;
    }

    message += ' ';
    message += entry.message;

    const fields = Logger.getFields(entry);

    if (Object.keys(fields).length > 0) {
      message += ` ${inspect(fields, {
        colors: chalk.level > 0,
        depth: 3,
        breakLength: Number.POSITIVE_INFINITY,
      })}`;
    }

    if (entry.error !== undefined) {
      message += `, ${Logger.formatError(entry.error as LogError)}`;
    }

    return message;
  }

  public static toRecord(
    entry: TransformableEntry,
    _context: LoggerOptions,
  ): LogRecord {
    return {
      time:
        typeof entry.time === 'string' ? entry.time : new Date().toISOString(),
      level: String(entry.level),
      message: Logger.removeColors(entry.message),
      ...(entry.label === undefined
        ? {}
        : { label: arrayFrom(entry.label).join(':') }),
      ...Logger.getFields(entry),
      ...(entry.error === undefined ? {} : { error: entry.error as LogError }),
      ...(typeof entry.runtime === 'number' ? { runtime: entry.runtime } : {}),
      ...(typeof entry.pid === 'number' ? { pid: entry.pid } : {}),
    };
  }

  public static jsonReplacer(_key: string, value: unknown): unknown {
    if (typeof value === 'bigint') {
      return value.toString();
    }

    return value;
  }

  public static json(
    options: JsonOptions,
    value: object,
    _context: LoggerOptions,
  ): string {
    const stringify = configureStringify(options);

    return (
      stringify(
        value,
        options.replacer ?? Logger.jsonReplacer,
        options.space,
      ) ?? 'STRINGIFY_ERROR'
    );
  }
}
