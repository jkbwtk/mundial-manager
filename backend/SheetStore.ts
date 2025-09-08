import crypto from 'node:crypto';
import { JWT } from 'google-auth-library';
import {
  GoogleSpreadsheet,
  type GoogleSpreadsheetWorksheet,
} from 'google-spreadsheet';
import { Store } from '#backend/Store';
import { environment } from '#backend/environment';
import type {
  MatchColumnConfig,
  SheetStoreOptions,
} from '#backend/types/SheetStore';
import { AsyncCached, bypassCache } from '#blib/cache';
import { logger } from '#shared/logger';
import { Match, MatchCreate, type MatchWithoutId } from '#shared/types/Sheets';
import {
  type RequiredDefaults,
  mergeOptions,
  objectToEntries,
  range,
  shortUUID,
} from '#shared/utils';

const defaultSheetStoreOptions: RequiredDefaults<SheetStoreOptions> = {
  credentials: {
    email: environment.GOOGLE_DOCS_API_EMAIL,
    key: environment.GOOGLE_DOCS_API_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  },
  sheetIndex: 0,
  spreadsheetId: environment.GOOGLE_DOCS_SPREADSHEET_ID,
};

export class SheetStore extends Store {
  public readonly uuid = crypto.randomUUID();

  private options: Required<SheetStoreOptions>;

  public doc: GoogleSpreadsheet;
  public sheet!: GoogleSpreadsheetWorksheet;

  public static readonly CONSTANTS = {
    MATCHES_FIRST_ROW: 1,
    MATCHES_LAST_ROW: 256,
    MATCHES_COLUMN_CONFIG: {
      team1: {
        index: 0,
      },
      team2: {
        index: 1,
      },
      score1: {
        index: 2,
      },
      score2: {
        index: 3,
      },
      floor: {
        index: 4,
      },
      winningColor: {
        index: 5,
      },
      duration: {
        index: 6,
        numberFormat: { type: 'TIME', pattern: 'hh:mm' },
      },
      date: {
        index: 7,
        numberFormat: { type: 'DATE', pattern: 'dd.mm.yyyy' },
      },
    } satisfies Record<keyof MatchWithoutId, MatchColumnConfig>,
  };

  constructor(userOptions: SheetStoreOptions = {}) {
    super();

    this.options = mergeOptions(userOptions, defaultSheetStoreOptions);

    this.doc = this.getDoc();
  }

  private getDoc(): GoogleSpreadsheet {
    const jwt = new JWT({
      email: this.options.credentials.email,
      key: this.options.credentials.key,
      scopes: this.options.credentials.scopes,
    });

    return new GoogleSpreadsheet(this.options.spreadsheetId, jwt);
  }

  public async initialize(): Promise<void> {
    logger.debug('Initializing SheetStore', {
      label: ['SheetStore', this.uuid, 'initialize'],
    });

    const t1 = performance.now();

    await this.doc.loadInfo();
    const sheet = this.doc.sheetsByIndex[this.options.sheetIndex];

    if (sheet === undefined) {
      throw new Error('Sheet not found');
    }

    this.sheet = sheet;

    super.initialize();

    logger.time('Sheet initialization', t1);
    logger.debug('SheetStore initialized', {
      label: ['SheetStore', shortUUID(this.uuid), 'initialize'],
    });
  }

  @AsyncCached({ ttl: 60 * 60 * 1000 }) // 1 hour
  private async loadMatchesCells(): Promise<void> {
    await this.sheet.loadCells({
      startRowIndex: SheetStore.CONSTANTS.MATCHES_FIRST_ROW,
      endRowIndex: SheetStore.CONSTANTS.MATCHES_LAST_ROW,

      startColumnIndex: Math.min(
        ...Object.values(SheetStore.CONSTANTS.MATCHES_COLUMN_CONFIG).map(
          (v) => v.index,
        ),
      ),
      endColumnIndex:
        Math.max(
          ...Object.values(SheetStore.CONSTANTS.MATCHES_COLUMN_CONFIG).map(
            (v) => v.index,
          ),
        ) + 1,
    });
  }

  private readMatchRow(row: number): Match | null {
    const rowData: Partial<Record<keyof Match, unknown>> = {
      id: row,
    };

    for (const [key, column] of objectToEntries(
      SheetStore.CONSTANTS.MATCHES_COLUMN_CONFIG,
    )) {
      const c = this.sheet.getCell(row, column.index);
      rowData[key] = c.value;
    }

    const match = Match.safeParse(rowData);

    return match.success ? match.data : null;
  }

  private writeMatchRow(row: number, match: MatchCreate) {
    const rowData = MatchCreate.encode(match);

    for (const [key, value] of objectToEntries(rowData)) {
      const columnConfig = SheetStore.CONSTANTS.MATCHES_COLUMN_CONFIG[
        key
      ] as MatchColumnConfig;

      const cell = this.sheet.getCell(row, columnConfig.index);

      if (columnConfig.numberFormat !== undefined) {
        cell.numberFormat = columnConfig.numberFormat;
      }

      // @ts-expect-error
      cell.value = value;
    }
  }

  @AsyncCached({ ttl: 10 * 1000 }) // 10 seconds
  public async getMatches(): Promise<Match[]> {
    await this.loadMatchesCells();

    const matches: Match[] = [];

    for (const row of range(
      SheetStore.CONSTANTS.MATCHES_FIRST_ROW,
      SheetStore.CONSTANTS.MATCHES_LAST_ROW,
    )) {
      const match = this.readMatchRow(row);

      if (match !== null) {
        matches.push(match);
      }
    }

    return matches;
  }

  public async createMatch(match: MatchCreate): Promise<Match> {
    await bypassCache(this.loadMatchesCells).call(this);

    const emptyRow = range(
      SheetStore.CONSTANTS.MATCHES_FIRST_ROW,
      SheetStore.CONSTANTS.MATCHES_LAST_ROW,
    ).find((row) => {
      const readMatch = this.readMatchRow(row);

      return readMatch === null;
    });

    if (emptyRow === undefined) {
      throw new Error('No empty row found for new match');
    }

    this.writeMatchRow(emptyRow, match);

    await this.sheet.saveUpdatedCells();

    const createdMatch = this.readMatchRow(emptyRow);

    if (createdMatch === null) {
      throw new Error('Failed to create new match.');
    }

    return createdMatch;
  }
}
