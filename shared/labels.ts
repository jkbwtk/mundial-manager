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
