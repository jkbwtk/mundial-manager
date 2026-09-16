export const ModelErrorTypeEnum = {
  MODEL_ERROR: 'MODEL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_VALUE: 'DUPLICATE_VALUE',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
  NON_NULL_VIOLATION: 'NON_NULL_VIOLATION',
  INVALID_FORMAT: 'INVALID_FORMAT',
} as const;

export type ModelErrorType =
  (typeof ModelErrorTypeEnum)[keyof typeof ModelErrorTypeEnum];

const ModelErrorMessages: Record<ModelErrorType, string> = {
  MODEL_ERROR: 'Request could not be processed',
  NOT_FOUND: 'Resource does not exist',
  DUPLICATE_VALUE: 'Value is already in use',
  FOREIGN_KEY_VIOLATION: 'Referenced resource does not exist',
  NON_NULL_VIOLATION: 'Value is required',
  INVALID_FORMAT: 'Value has an invalid format',
};

export function getModelErrorMessage(errorType: string): string {
  return ModelErrorMessages[errorType as ModelErrorType] ?? errorType;
}
