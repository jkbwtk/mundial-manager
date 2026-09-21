import chalk from 'chalk';
import { ModelError, type ModelErrorFieldMap } from '#blib/modelErrors';
import { logger } from '#shared/logger';

interface ImportResourcesOptions<T, R> {
  name: string;
  label: string[];
  sources: Iterable<T>;
  describe: (source: T) => string;
  create: (source: T) => Promise<R>;
}

export interface ImportFailure {
  description: string;
  data: unknown;
  error: unknown;
}

export class DryRunRollback extends Error {}

export class ImportError extends Error {
  public resource: string;
  public processed: number;
  public failures: ImportFailure[];

  public constructor(
    resource: string,
    processed: number,
    failures: ImportFailure[],
  ) {
    super(
      `${failures.length} of ${processed} legacy ${resource} are invalid, nothing was imported`,
    );

    this.name = 'ImportError';
    this.resource = resource;
    this.processed = processed;
    this.failures = failures;
  }
}

const MAX_DATA_LENGTH = 4000;
const MAX_CAUSE_DEPTH = 4;
const MAX_STACK_FRAMES = 6;

function jsonReplacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Set) return Array.from(value);
  if (value instanceof Map) return Object.fromEntries(value);

  return value;
}

function stringify(value: unknown, indentation?: number): string {
  try {
    return JSON.stringify(value, jsonReplacer, indentation) ?? String(value);
  } catch {
    return String(value);
  }
}

function indent(lines: string[], depth: number): string[] {
  const padding = ' '.repeat(depth);

  return lines.flatMap((line) =>
    line.split('\n').map((part) => `${padding}${part}`),
  );
}

function getErrorName(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}

function formatFields(fields: ModelErrorFieldMap): string[] {
  return Object.entries(fields).flatMap(([name, field]) =>
    [field].flat().map((entry) => {
      const value = 'value' in entry ? ` (got ${stringify(entry.value)})` : '';

      return `${chalk.bold(name)}: ${entry.errorType}${value}`;
    }),
  );
}

function formatStack(error: Error): string[] {
  const frames = error.stack?.split('\n').slice(1) ?? [];

  if (frames.length === 0) return [];

  return indent(
    frames.slice(0, MAX_STACK_FRAMES).map((frame) => chalk.gray(frame.trim())),
    2,
  );
}

function formatError(error: unknown): string[] {
  const lines: string[] = [];
  let current: unknown = error;
  let depth = 0;

  while (current !== undefined && current !== null && depth < MAX_CAUSE_DEPTH) {
    const prefix = depth === 0 ? '' : 'caused by ';

    if (!(current instanceof Error)) {
      lines.push(`${prefix}${String(current)}`);
      break;
    }

    lines.push(`${prefix}${chalk.bold(current.name)}: ${current.message}`);

    if (current instanceof ModelError) {
      lines.push(...indent(formatFields(current.fields), 2));
    } else {
      lines.push(...formatStack(current));
    }

    if ('detail' in current && typeof current.detail === 'string') {
      lines.push(...indent([chalk.gray(current.detail)], 2));
    }

    current = current.cause;
    depth += 1;
  }

  return lines;
}

function countByError(failures: ImportFailure[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const failure of failures) {
    const name = getErrorName(failure.error);

    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return counts;
}

function formatData(data: unknown): string[] {
  const text = stringify(data, 2);
  const truncated =
    text.length > MAX_DATA_LENGTH
      ? `${text.slice(0, MAX_DATA_LENGTH)}\n… ${text.length - MAX_DATA_LENGTH} more characters`
      : text;

  return indent([chalk.gray(truncated)], 4);
}

export function formatImportError(error: ImportError): string {
  const { failures, processed, resource } = error;

  const lines: string[] = [
    chalk.red.bold(
      `${failures.length} of ${processed} legacy ${resource} are invalid, nothing was imported`,
    ),
    chalk.red('Failures by error:'),
    ...indent(
      Array.from(
        countByError(failures),
        ([name, count]) => `${chalk.bold(name)}: ${count}`,
      ),
      2,
    ),
  ];

  failures.forEach((failure, index) => {
    lines.push('');
    lines.push(
      chalk.red.bold(
        `[${index + 1}/${failures.length}] ${failure.description}`,
      ),
    );
    lines.push(...indent(formatError(failure.error), 2));
    lines.push(...indent(['Offending data:'], 2));
    lines.push(...formatData(failure.data));
  });

  return lines.join('\n');
}

export async function importResources<T, R>({
  name,
  label,
  sources,
  describe,
  create,
}: ImportResourcesOptions<T, R>): Promise<R[]> {
  const created: R[] = [];
  const failures: ImportFailure[] = [];
  let processed = 0;

  for (const source of sources) {
    processed += 1;

    logger.debug('Processing legacy %s', describe(source), { label });

    try {
      created.push(await create(source));
    } catch (error) {
      const description = describe(source);

      failures.push({ description, data: source, error });

      logger.error(
        'Legacy %s is invalid: %s',
        description,
        error instanceof Error ? error.message : String(error),
        { label },
      );
    }
  }

  if (failures.length > 0) {
    throw new ImportError(name, processed, failures);
  }

  return created;
}
