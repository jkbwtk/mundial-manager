import { z } from 'zod';
import { isValidTimeZone } from '#shared/timeUtils';

export const jsonCodec = <T extends z.core.SomeType>(schema: T) =>
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

export type DeepPartial<T> = T extends Date | readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

type DefaultedShape<Shape extends z.ZodRawShape, Defaults> = {
  [K in keyof Shape]: K extends keyof Defaults
    ? Shape[K] extends z.ZodObject<infer Inner>
      ? z.ZodPrefault<
          z.ZodObject<DefaultedShape<Inner, NonNullable<Defaults[K]>>>
        >
      : z.ZodDefault<Shape[K]>
    : Shape[K];
};

export function withDefaults<
  T extends z.ZodObject,
  const Defaults extends DeepPartial<z.output<T>>,
>(
  schema: T,
  defaults: Defaults,
): z.ZodObject<DefaultedShape<T['shape'], Defaults>> {
  const overrides: Record<string, z.ZodType> = {};

  for (const [key, value] of Object.entries(defaults)) {
    const field = schema.shape[key] as z.ZodType | undefined;

    if (field === undefined) continue;

    overrides[key] =
      field instanceof z.ZodObject &&
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
        ? withDefaults(field, value).prefault({})
        : field.default(value);
  }

  // biome-ignore lint/suspicious/noExplicitAny: yeah
  return schema.extend(overrides) as any;
}

export const PaginatedResponse = <T extends z.core.SomeType>(schema: T) => {
  return z.object({
    data: z.array(schema),
    total: z.number().nonnegative(),
  });
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
};

const unwrapToZodContainer = (
  schemaType: z.ZodTypeAny,
): z.ZodObject | z.ZodRecord | undefined => {
  let current: z.ZodTypeAny = schemaType;

  while (!(current instanceof z.ZodObject || current instanceof z.ZodRecord)) {
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
  let container: z.ZodObject | z.ZodRecord | undefined = rootSchema;
  let field: z.ZodTypeAny | undefined;

  for (const segment of path) {
    if (!container) return undefined;

    field =
      container instanceof z.ZodRecord
        ? (container.valueType as z.ZodTypeAny)
        : container.shape[segment];

    if (field === undefined) return undefined;

    container = unwrapToZodContainer(field);
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

export const TimeZone = z.string().refine(isValidTimeZone, 'TIMEZONE_INVALID');
export type TimeZone = z.infer<typeof TimeZone>;
