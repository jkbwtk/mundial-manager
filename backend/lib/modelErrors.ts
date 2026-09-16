import { TRPCError } from '@trpc/server';
import { DrizzleQueryError } from 'drizzle-orm';
import { DatabaseError as PgDatabaseError } from 'pg';
import type { Model } from '#backend/db/Model';
import { logger } from '#shared/logger';
import { ModelErrorTypeEnum } from '#shared/modelErrors';
import { ZodLikeError } from '#shared/zod';

export interface ModelErrorField {
  value?: unknown;
  errorType: string;
}

export type ModelErrorFieldMap = Record<
  string,
  ModelErrorField | ModelErrorField[]
>;

export type ModelErrorFields = string[] | ModelErrorFieldMap;

function resolveFields(
  fields: ModelErrorFields,
  errorType: string,
): ModelErrorFieldMap {
  if (!Array.isArray(fields)) return fields as ModelErrorFieldMap;

  return Object.fromEntries(
    fields.map((field: string) => [field, { errorType }]),
  );
}

export class ModelError extends Error {
  public static defaultErrorType: string = ModelErrorTypeEnum.MODEL_ERROR;

  public fields: ModelErrorFieldMap;
  public trpcCode: TRPCError['code'];

  public constructor(
    message: string,
    fields: ModelErrorFields,
    trpcCode: TRPCError['code'],
    options?: ErrorOptions,
  ) {
    super(message, options);

    this.name = 'ModelError';
    this.trpcCode = trpcCode;

    this.fields = resolveFields(fields, new.target.defaultErrorType);
  }

  public toTRPCError() {
    return new TRPCError({
      code: this.trpcCode,
      cause: this,
      message: ZodLikeError.encode({
        name: this.name,
        properties: Object.fromEntries(
          Object.entries(this.fields).map(([key, field]) => [
            key,
            {
              errors: [field].flat().map((entry) => entry.errorType),
            },
          ]),
        ),
      }),
    });
  }
}

export class DuplicateValueError extends ModelError {
  public static defaultErrorType: string = ModelErrorTypeEnum.DUPLICATE_VALUE;

  public constructor(
    message: string,
    fields: ModelErrorFields,
    options?: ErrorOptions,
  ) {
    super(message, fields, 'CONFLICT', options);

    this.name = 'DuplicateValueError';
  }
}

export class ForeignKeyViolationError extends ModelError {
  public static defaultErrorType: string =
    ModelErrorTypeEnum.FOREIGN_KEY_VIOLATION;

  public constructor(
    message: string,
    fields: ModelErrorFields,
    options?: ErrorOptions,
  ) {
    super(message, fields, 'BAD_REQUEST', options);

    this.name = 'ForeignKeyViolationError';
  }
}

export class NonNullViolationError extends ModelError {
  public static defaultErrorType: string =
    ModelErrorTypeEnum.NON_NULL_VIOLATION;

  public constructor(
    message: string,
    fields: ModelErrorFields,
    options?: ErrorOptions,
  ) {
    super(message, fields, 'BAD_REQUEST', options);

    this.name = 'NonNullViolationError';
  }
}

export class FormatViolationError extends ModelError {
  public static defaultErrorType: string = ModelErrorTypeEnum.INVALID_FORMAT;

  public constructor(
    message: string,
    fields: ModelErrorFields,
    options?: ErrorOptions,
  ) {
    super(message, fields, 'BAD_REQUEST', options);

    this.name = 'FormatViolationError';
  }
}

export class DatabaseError extends ModelError {
  public constructor(
    message: string,
    fields: ModelErrorFields,
    options?: ErrorOptions,
  ) {
    super(message, fields, 'INTERNAL_SERVER_ERROR', options);

    this.name = 'DatabaseError';
  }
}

export class StrategyValidationError extends ModelError {
  public constructor(
    message: string,
    fields: ModelErrorFields,
    options?: ErrorOptions,
  ) {
    super(message, fields, 'BAD_REQUEST', options);

    this.name = 'StrategyValidationError';
  }
}

export class NotFoundError extends ModelError {
  public static defaultErrorType: string = ModelErrorTypeEnum.NOT_FOUND;

  public constructor(
    message: string,
    fields: ModelErrorFields,
    options?: ErrorOptions,
  ) {
    super(message, fields, 'NOT_FOUND', options);

    this.name = 'NotFoundError';
  }
}

export class ConnectionError extends ModelError {
  public constructor(
    message: string,
    fields: ModelErrorFields,
    options?: ErrorOptions,
  ) {
    super(message, fields, 'INTERNAL_SERVER_ERROR', options);

    this.name = 'DatabaseConnectionError';
  }
}

function getDriverErrorCode(error: Error): string | undefined {
  if (error instanceof PgDatabaseError) return error.code;

  if ('syscall' in error && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }

  return undefined;
}

const ConstraintKeyRegex = /^Key \((.+?)\)=\((.*)\) (?:already exists|is not)/;

function getConstraintFields(
  detail: string | undefined,
  errorType: string,
): ModelErrorFieldMap {
  const extracted = detail ? ConstraintKeyRegex.exec(detail) : null;

  if (!extracted) return {};

  const [, columnList = '', valueList = ''] = extracted;

  const columns = columnList
    .split(', ')
    .map((column) => column.replace(/^"(.*)"$/, '$1'));
  const values = valueList.split(', ');

  const valueAt = (index: number) =>
    values.length === columns.length ? values[index] : valueList;

  return Object.fromEntries(
    columns.flatMap((column, index) =>
      column === 'leagueUuid'
        ? []
        : [[column, { value: valueAt(index), errorType }]],
    ),
  );
}

function convertDriverError(
  error: Error,
  code: string,
  cause: Error,
): ModelError {
  const pgError = error instanceof PgDatabaseError ? error : undefined;
  const options = { cause };

  switch (code) {
    case '23505':
      return new DuplicateValueError(
        'Duplicate value error',
        getConstraintFields(
          pgError?.detail,
          ModelErrorTypeEnum.DUPLICATE_VALUE,
        ),
        options,
      );

    case '23503':
      return new ForeignKeyViolationError(
        'Foreign key violation error',
        getConstraintFields(
          pgError?.detail,
          ModelErrorTypeEnum.FOREIGN_KEY_VIOLATION,
        ),
        options,
      );

    case '23502':
      return new NonNullViolationError(
        'Non-null violation error',
        pgError?.column
          ? {
              [pgError.column]: {
                value: null,
                errorType: ModelErrorTypeEnum.NON_NULL_VIOLATION,
              },
            }
          : {},
        options,
      );

    case '22P02':
      return new FormatViolationError('Format violation error', {}, options);

    case 'ECONNREFUSED':
      return new ConnectionError('Database connection refused', {}, options);

    default:
      return new DatabaseError('Database error', {}, options);
  }
}

export function ConvertDrizzleErrors() {
  // biome-ignore lint/suspicious/noExplicitAny: yeah
  return <T extends (...args: any[]) => any>(
    target: T,
    _ctx: ClassMemberDecoratorContext,
  ) => {
    const wrappedMethod = async function (
      this: typeof Model,
      ...args: unknown[]
    ) {
      const label = this.name ?? 'unknown';
      const name = 'realName' in target ? target.realName : target.name;

      try {
        return await target.call(this, ...args);
      } catch (err) {
        if (!(err instanceof Error)) throw err;

        const dbError =
          err instanceof DrizzleQueryError && err.cause ? err.cause : err;
        const code = getDriverErrorCode(dbError);

        if (code === undefined) throw err;

        const converted = convertDriverError(dbError, code, err);

        if (converted instanceof DatabaseError) {
          logger.error('Unhandled database error', {
            label: [label, name],
            error: err,
          });
        }

        throw converted;
      }
    };

    if (!('realName' in target)) {
      wrappedMethod.realName = target.name;
    }

    return wrappedMethod;
  };
}

export async function runWithErrorConversion<
  // biome-ignore lint/suspicious/noExplicitAny: yeah
  T extends (...args: unknown[]) => any,
>(fn: T): Promise<ReturnType<T>> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ModelError) {
      throw err.toTRPCError();
    }
    throw err;
  }
}
