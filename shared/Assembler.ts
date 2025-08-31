export type Maybe<T> = T | null;

export class Assembler<InputType, ContextType = void, V = InputType> {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private transformers: ((value: any, context: ContextType) => any)[] = [];

  private failed = false;

  private value: Maybe<V> = null;

  public assemble(value: InputType, context: ContextType): Maybe<V> {
    this.failed = false;
    this.value = null;

    let result = value;

    try {
      for (const transformer of this.transformers) {
        result = transformer(result as InputType, context);
      }

      this.value = result as Maybe<V>;
      return this.value;
    } catch {
      this.failed = true;
      return null;
    }
  }

  public chain<R>(
    func: (value: V, context: ContextType) => R,
  ): Assembler<InputType, ContextType, R> {
    this.transformers.push(func);

    return this as unknown as Assembler<InputType, ContextType, R>;
  }

  public didFail(): boolean {
    return this.failed;
  }

  public copy(): Assembler<InputType, ContextType, V> {
    const assembler = new Assembler<InputType, ContextType, V>();

    assembler.transformers = [...this.transformers];

    return assembler;
  }
}
