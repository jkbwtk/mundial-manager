import { TRPCError } from '@trpc/server';
import { DrizzleQueryError } from 'drizzle-orm';
import { logger } from '#shared/logger';

export interface ModelErrorField {
  value: unknown;
  errorType: string;
}

export type ModelErrorFields = Record<string, ModelErrorField>;

export class ModelError extends Error {
  public fields: ModelErrorFields;
  public trpcCode: TRPCError['code'];

  public constructor(
    message: string,
    fields: ModelErrorFields,
    trpcCode: TRPCError['code'],
  ) {
    super(message);

    this.name = 'ModelError';
    this.trpcCode = trpcCode;

    this.fields = fields;
  }

  public toTRPCError() {
    return new TRPCError({
      code: this.trpcCode,
      message: this.message,
      cause: this.fields,
    });
  }
}

export class DuplicateValueError extends ModelError {
  public constructor(message: string, fields: ModelErrorFields) {
    super(message, fields, 'CONFLICT');

    this.name = 'DuplicateValueError';
  }
}

export class ForeignKeyViolationError extends ModelError {
  public constructor(message: string, fields: ModelErrorFields) {
    super(message, fields, 'BAD_REQUEST');

    this.name = 'ForeignKeyViolationError';
  }
}

export class NonNullViolationError extends ModelError {
  public constructor(message: string, fields: ModelErrorFields) {
    super(message, fields, 'BAD_REQUEST');

    this.name = 'NonNullViolationError';
  }
}

export class FormatViolationError extends ModelError {
  public constructor(message: string, fields: ModelErrorFields) {
    super(message, fields, 'BAD_REQUEST');

    this.name = 'FormatViolationError';
  }
}

export class DatabaseError extends ModelError {
  public constructor(message: string, fields: ModelErrorFields) {
    super(message, fields, 'INTERNAL_SERVER_ERROR');

    this.name = 'DatabaseError';
  }
}

export class StrategyValidationError extends ModelError {
  public constructor(message: string, fields: ModelErrorFields) {
    super(message, fields, 'BAD_REQUEST');

    this.name = 'StrategyValidationError';
  }
}

export function ConvertDrizzleErrors(label = 'unknown') {
  // biome-ignore lint/suspicious/noExplicitAny: yeah
  return <T extends (...args: any[]) => any>(
    target: T,
    _ctx: ClassMemberDecoratorContext,
  ) => {
    const wrappedMethod = async function (this: unknown, ...args: unknown[]) {
      try {
        return await target.call(this, ...args);
      } catch (err) {
        if (
          err instanceof DrizzleQueryError &&
          err.cause &&
          'code' in err.cause
        ) {
          switch (err.cause.code) {
            case '23505': {
              const fields: ModelErrorFields = {};

              throw new DuplicateValueError('Duplicate value error', fields);
            }

            case '23503': {
              const fields: ModelErrorFields = {};

              throw new ForeignKeyViolationError(
                'Foreign key violation error',
                fields,
              );
            }

            case '23502': {
              const fields: ModelErrorFields = {};

              throw new NonNullViolationError(
                'Non-null violation error',
                fields,
              );
            }

            case '22P02': {
              const fields: ModelErrorFields = {};

              throw new FormatViolationError('Format violation error', fields);
            }

            default:
              logger.error('Unhandled DrizzleQueryError:', {
                label: [label, target.name],
                error: err,
              });

              throw new DatabaseError('Database error', {});
          }
        }

        throw err;
      }
    };

    return wrappedMethod;
  };
}
