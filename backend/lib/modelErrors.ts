import { TRPCError } from '@trpc/server';

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

export class StrategyValidationError extends ModelError {
  public constructor(message: string, fields: ModelErrorFields) {
    super(message, fields, 'BAD_REQUEST');

    this.name = 'StrategyValidationError';
  }
}
