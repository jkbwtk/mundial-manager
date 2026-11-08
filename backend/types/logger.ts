import z from 'zod';

export const LogLevelEnum = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  HTTP: 'http',
  TRPC: 'trpc',
  VERBOSE: 'verbose',
  DEBUG: 'debug',
  TIME: 'time',
  LOG_QUERY: 'logQuery',
} as const;

export const LogLevel = z.enum(LogLevelEnum);
export type LogLevel = z.infer<typeof LogLevel>;

export const LogFormatEnum = {
  JSON: 'json',
  PRETTY: 'pretty',
} as const;

export const LogFormat = z.enum(LogFormatEnum);
export type LogFormat = z.infer<typeof LogFormat>;
