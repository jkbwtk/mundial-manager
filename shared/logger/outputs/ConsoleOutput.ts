import { LoggerOutput } from '#shared/logger/outputs/LoggerOutput';
import {
  LEVEL,
  type LoggerOptions,
  type OutputOptions,
  type TransformableEntry,
} from '#shared/logger/types';

type ConsoleOutputOptions = OutputOptions & {
  stderrLevels?: string[];
};

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

    this.write(
      entry,
      this.options.format.assemble(copy, context) ?? this.formatFallback(entry),
    );
  }

  protected override write(entry: TransformableEntry, line: string): void {
    if (this.options.stderrLevels?.includes(String(entry[LEVEL]))) {
      console.error(line);
    } else {
      console.log(line);
    }
  }

  public close(): void {
    // Nothing to do here
  }
}
