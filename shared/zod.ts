import { z } from 'zod';

export const jsonCodec = <T extends z.core.$ZodType>(schema: T) =>
  z.codec(z.string(), schema, {
    decode: (jsonString, ctx) => {
      try {
        return JSON.parse(jsonString);
        // biome-ignore lint/suspicious/noExplicitAny: yeah
      } catch (err: any) {
        ctx.issues.push({
          code: 'invalid_format',
          format: 'json',
          input: jsonString,
          message: err.message,
        });
        return z.NEVER;
      }
    },
    encode: (value) => JSON.stringify(value),
  });

export const hexColor = z
  .string()
  .regex(/^(#[0-9A-Fa-f]{6}|0x[0-9A-Fa-f]{8})$/);

export const uuidArray = z
  .array(z.uuid())
  .pipe(z.transform((arr) => Array.from(new Set(arr))));

export const ZodPropertyError = z.object({
  errors: z.array(z.string()),
});

export type ZodPropertyError = z.infer<typeof ZodPropertyError>;

export const ZodLikeError = jsonCodec(
  z.object({
    name: z.string(),
    properties: z.record(z.string(), ZodPropertyError),
  }),
);

export type ZodLikeError = z.infer<typeof ZodLikeError>;

export const PaginatedResponse = <T extends z.core.$ZodType>(schema: T) => {
  return z.object({
    data: z.array(schema),
    total: z.number().nonnegative(),
  });
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
};

const unwrapToZodObject = (
  schemaType: z.ZodTypeAny,
): z.ZodObject | undefined => {
  let current: z.ZodTypeAny = schemaType;

  while (!(current instanceof z.ZodObject)) {
    if (!('unwrap' in current) || typeof current.unwrap !== 'function') {
      return undefined;
    }

    current = current.unwrap();
  }

  return current;
};

export const resolveSchemaField = (
  rootSchema: z.ZodObject,
  path: string[],
): z.ZodTypeAny | undefined => {
  let currentObject: z.ZodObject | undefined = rootSchema;
  let field: z.ZodTypeAny | undefined;

  for (const segment of path) {
    if (!currentObject) return undefined;

    field = currentObject.shape[segment];

    if (field === undefined) return undefined;

    currentObject = unwrapToZodObject(field);
  }

  return field;
};

export const setPath = (
  target: Record<string, unknown>,
  path: string[],
  value: unknown,
): void => {
  const [head, ...rest] = path;

  if (head === undefined) return;

  if (rest.length === 0) {
    target[head] = value;
    return;
  }

  const existing = target[head];

  const next =
    typeof existing === 'object' &&
    existing !== null &&
    !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};

  target[head] = next;
  setPath(next, rest, value);
};

interface ErrorTreeNode {
  errors: string[];
  properties?: Record<string, ErrorTreeNode | undefined>;
}

export const getNestedErrors = (
  tree: ErrorTreeNode | undefined,
  path: string[],
): string[] | undefined => {
  let node: ErrorTreeNode | undefined = tree;

  for (const segment of path) {
    node = node?.properties?.[segment];
  }

  return node?.errors;
};
