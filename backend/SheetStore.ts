import crypto from 'node:crypto';
import { JWT } from 'google-auth-library';
import {
  GoogleSpreadsheet,
  type GoogleSpreadsheetWorksheet,
} from 'google-spreadsheet';
import { environment } from '#backend/environment';
import { Store } from '#backend/Store';
import type {
  MatchColumnConfig,
  MatchesEmitterEvents,
  SheetStoreOptions,
} from '#backend/types/SheetStore';
import { sendMatchSummaryWebhook } from '#backend/webhookUtils';
import { AsyncCached, bypassCache } from '#blib/cache';
import { TypedEventEmitter } from '#blib/utils';
import { logger } from '#shared/logger';
import { getMatchHash, getPauseDuration } from '#shared/matchUtils';
import {
  type Match,
  MatchCreate,
  MatchWithoutMetadata,
} from '#shared/types/Sheets';
import {
  mergeOptions,
  objectToEntries,
  type RequiredDefaults,
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

class MatchesEmitter extends TypedEventEmitter<MatchesEmitterEvents> {}

export class SheetStore extends Store {
  public readonly uuid = crypto.randomUUID();

  private options: Required<SheetStoreOptions>;

  public doc: GoogleSpreadsheet;
  public sheet!: GoogleSpreadsheetWorksheet;

  public matchesEmitter = new MatchesEmitter();

  public static readonly CONSTANTS = {
    MATCHES_FIRST_ROW: 1,
    MATCHES_LAST_ROW: 999,
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
      replayMetadata: {
        index: 9,
        wrapStrategy: 'CLIP',
      },
    } satisfies Record<keyof MatchWithoutMetadata, MatchColumnConfig>,
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

    await this.doc.loadInfo(true);
    const sheet = this.doc.sheetsByIndex[this.options.sheetIndex];

    if (sheet === undefined) {
      throw new Error('Sheet not found');
    }

    this.sheet = sheet;

    super.initialize();

    this.matchesEmitter.on('matchCreated', (match) => {
      sendMatchSummaryWebhook(match);
    });

    logger.time('Sheet initialization', t1);
    logger.debug('SheetStore initialized', {
      label: ['SheetStore', shortUUID(this.uuid), 'initialize'],
    });
  }

  @AsyncCached({ ttl: 10 * 1000 }) // 10 seconds
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
    const rowData: Partial<Record<keyof Match, unknown>> = {};

    for (const [key, column] of objectToEntries(
      SheetStore.CONSTANTS.MATCHES_COLUMN_CONFIG,
    )) {
      const c = this.sheet.getCell(row, column.index);
      rowData[key] = c.value;
    }

    const match = MatchWithoutMetadata.safeParse(rowData);

    if (match.success) {
      return {
        id: row,
        hash: getMatchHash(match.data),
        pauseDuration: getPauseDuration(
          match.data.replayMetadata?.events ?? [],
        ),
        ...match.data,
      };
    }

    return null;
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

      if (columnConfig.wrapStrategy !== undefined) {
        cell.wrapStrategy = columnConfig.wrapStrategy;
      }

      cell.value = value;
    }
  }

  public getLocalMatches(): Match[] {
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

  // @AsyncCached({ ttl: 10 * 1000 }) // 10 seconds
  public async getMatches(): Promise<Match[]> {
    await this.loadMatchesCells();

    const matches = this.getLocalMatches();

    this.matchesEmitter.emit('synced', matches);

    return matches;
  }

  public checkIfMatchExists(
    match: Match | MatchWithoutMetadata | MatchCreate,
    matches: Match[] = this.getLocalMatches(),
  ): boolean {
    const hash = getMatchHash(match);

    return matches.some((m) => m.hash === hash);
  }

  private findEmptyRows(count: number): number[] {
    const emptyRows: number[] = [];

    for (const row of range(
      SheetStore.CONSTANTS.MATCHES_FIRST_ROW,
      SheetStore.CONSTANTS.MATCHES_LAST_ROW,
    )) {
      const readMatch = this.readMatchRow(row);

      if (readMatch === null) {
        emptyRows.push(row);

        if (emptyRows.length >= count) {
          break;
        }
      }
    }

    return emptyRows;
  }

  private findEmptyRow(): number | undefined {
    const emptyRows = this.findEmptyRows(1);

    return emptyRows[0];
  }

  public async createMatch(match: MatchCreate): Promise<Match> {
    await bypassCache(this.loadMatchesCells).call(this);

    if (this.checkIfMatchExists(match)) {
      throw new Error('Match already exists.');
    }

    const emptyRow = this.findEmptyRow();

    if (emptyRow === undefined) {
      throw new Error('No empty row found for new match');
    }

    this.writeMatchRow(emptyRow, match);

    await this.sheet.saveUpdatedCells();

    const createdMatch = this.readMatchRow(emptyRow);

    if (createdMatch === null) {
      throw new Error('Failed to create new match.');
    }

    this.matchesEmitter.emit('matchCreated', createdMatch);

    return createdMatch;
  }

  public async createMatches(matches: MatchCreate[]): Promise<Match[]> {
    await bypassCache(this.loadMatchesCells).call(this);

    const matchCache = this.getLocalMatches();
    const writtenRows: number[] = [];
    const hashes = new Set<string>();

    const uniqueMatches = matches.filter((match) => {
      const hash = getMatchHash(match);

      if (this.checkIfMatchExists(match, matchCache) || hashes.has(hash)) {
        logger.warn('Match already exists, skipping creation.', {
          label: ['SheetStore', shortUUID(this.uuid), 'createMatches'],
          match,
        });

        return false;
      }

      hashes.add(hash);
      return true;
    });

    const emptyRows = this.findEmptyRows(uniqueMatches.length);
    let emptyRowIndex = 0;

    for (const match of uniqueMatches) {
      const emptyRow = emptyRows[emptyRowIndex++];

      if (emptyRow === undefined) {
        throw new Error('No empty row found for new match');
      }

      this.writeMatchRow(emptyRow, match);
      writtenRows.push(emptyRow);
    }

    await this.sheet.saveUpdatedCells();

    return writtenRows.map((row) => {
      const createdMatch = this.readMatchRow(row);

      if (createdMatch === null) {
        throw new Error('Failed to create new match.');
      }

      this.matchesEmitter.emit('matchCreated', createdMatch);

      return createdMatch;
    });
  }
}
