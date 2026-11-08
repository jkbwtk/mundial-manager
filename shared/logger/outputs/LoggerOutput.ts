import {
  LEVEL,
  type LoggerOptions,
  MESSAGE,
  type OutputOptions,
  type TransformableEntry,
} from '#shared/logger/types';

export abstract class LoggerOutput {
  protected abstract options: OutputOptions;

  public log(_context: LoggerOptions, _entry: TransformableEntry): void {
    throw new Error('Method not implemented.');
  }

  public close(): void {
    throw new Error('Method not implemented.');
  }

  public logFallback(context: LoggerOptions, entry: TransformableEntry): void {
    if (!this.canLog(context, entry)) return;

    this.write(entry, this.formatFallback(entry));
  }

  protected write(_entry: TransformableEntry, _line: string): void {
    throw new Error('Method not implemented.');
  }

  protected formatFallback(entry: TransformableEntry): string {
    try {
      if (this.options.fallback) return this.options.fallback(entry);
    } catch {}

    return `[${String(entry[LEVEL]).toUpperCase()}] ${String(entry[MESSAGE])} (log formatting failed)`;
  }

  protected canLog(context: LoggerOptions, entry: TransformableEntry): boolean {
    const level = context.levels[entry[LEVEL]];
    if (level === undefined) {
      return false;
    }

    if (typeof this.options.level === 'number') {
      return level.level <= this.options.level;
    }

    if (Array.isArray(this.options.level)) {
      return this.options.level.includes(entry[LEVEL].toString());
    }

    const targetLevel = context.levels[this.options.level];
    if (targetLevel === undefined) {
      return false;
    }

    if (typeof this.options.level === 'string') {
      return level.level <= targetLevel.level;
    }

    return false;
  }
}
