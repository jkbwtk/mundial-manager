import type { DropdownOption } from '#components/Dropdown';

export interface ExtractorStepOption extends DropdownOption {}

export type MaybeE<T> = T | null;

export class Extractor<InputType, ContextType = void, ReturnType = InputType> {
  // biome-ignore lint/suspicious/noExplicitAny: yeah
  private extractors: ((value: any, context: ContextType) => any)[] = [];

  public extract(
    initValue: InputType,
    context: ContextType,
  ): MaybeE<ReturnType> {
    let value: unknown = initValue;

    try {
      for (const extractor of this.extractors) {
        value = extractor(value as InputType, context);
      }

      return value as MaybeE<ReturnType>;
    } catch {
      return null;
    }
  }

  public chain<R>(
    func: (value: NonNullable<ReturnType>, context: ContextType) => R,
  ): Extractor<InputType, ContextType, R> {
    this.extractors.push(func);

    return this as unknown as Extractor<InputType, ContextType, R>;
  }
}
