import type { GoogleSpreadsheetCell } from 'google-spreadsheet';
import type { Match } from '#shared/types/Sheets';

export interface Credentials {
  email: string;
  key: string;
  scopes: string[];
}

export type SheetStoreOptions = {
  credentials?: Partial<Credentials>;
  spreadsheetId?: string;
  sheetIndex?: number;
};

type NumberFormatType = GoogleSpreadsheetCell['numberFormat'];

type WrapStrategy = GoogleSpreadsheetCell['wrapStrategy'];

export interface MatchColumnConfig {
  index: number;
  numberFormat?: NumberFormatType;
  wrapStrategy?: WrapStrategy;
}

export interface MatchesEmitterEvents {
  synced: [Match[]];
  matchCreated: [Match];
}
