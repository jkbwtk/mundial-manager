import z from 'zod';

export const LabelValueTypes = z.union([
  z.null(),
  z.number(),
  z.string(),
  z.boolean(),
]);
export type LabelValueTypes = z.infer<typeof LabelValueTypes>;

export const Labels = z.record(z.string(), LabelValueTypes);
export type Labels = z.infer<typeof Labels>;

export function getLabelValue<
  T extends z.ZodNull | z.ZodNumber | z.ZodString | z.ZodBoolean,
>(
  instance: { labels: Labels },
  key: string,
  type: T,
  defaultValue?: z.infer<T>,
): z.infer<T> {
  const rawValue = instance.labels[key];

  if (rawValue === undefined && defaultValue !== undefined) {
    return defaultValue;
  }

  if (rawValue === undefined) {
    throw new Error(`Label ${key} not found`);
  }

  // @ts-expect-error
  return type.parse(rawValue);
}
