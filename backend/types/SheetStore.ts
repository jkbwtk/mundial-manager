import type { GoogleSpreadsheetCell } from 'google-spreadsheet';

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
