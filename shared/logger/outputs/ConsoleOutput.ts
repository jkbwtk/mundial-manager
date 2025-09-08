import { LoggerOutput } from '#shared/logger/outputs/LoggerOutput';
import type {
  LoggerOptions,
  OutputOptions,
  TransformableEntry,
} from '#shared/logger/types';

type ConsoleOutputOptions = OutputOptions;

export class ConsoleOutput extends LoggerOutput {
  protected options: ConsoleOutputOptions;

  constructor(options: ConsoleOutputOptions) {
    super();

    this.options = options;
  }

  public log(context: LoggerOptions, entry: TransformableEntry): void {
    if (!this.canLog(context, entry)) {
      return;
    }

    const copy = { ...entry };
    const result = this.options.format.assemble(copy, context);

    if (result === null) {
      return;
    }

    console.log(result);
  }

  public close(): void {
    // Nothing to do here
  }
}
