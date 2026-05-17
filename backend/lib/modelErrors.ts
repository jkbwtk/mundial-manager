import { TRPCError } from '@trpc/server';
import { DrizzleQueryError } from 'drizzle-orm';
import { logger } from '#shared/logger';
import { ZodLikeError } from '#shared/zod';

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
      cause: this,
      message: ZodLikeError.encode({
        name: this.name,
        properties: Object.fromEntries(
          Object.entries(this.fields).map(([key, field]) => [
            key,
            {
              errors: [field.errorType],
            },
          ]),
        ),
      }),
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

const DuplicateExtractRegex = /Key \((.+)\)=\((.+)\) already exists\./;

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

              if (
                'detail' in err.cause &&
                typeof err.cause.detail === 'string'
              ) {
                const extracted = DuplicateExtractRegex.exec(err.cause.detail);

                if (extracted) {
                  const [, field, value] = extracted;

                  if (typeof field === 'string' && typeof value === 'string') {
                    fields[field] = {
                      value,
                      errorType: 'Duplicate value: entry already exists',
                    };
                  }
                }
              }

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
