import { sql } from 'drizzle-orm';
import { ModelOps } from '#backend/db/models/ModelOps';
import { tablesTable } from '#backend/db/schema';
import { TableSelectSchema } from '#backend/types/db/table';
import { StrategyValidationError } from '#blib/modelErrors';
import {
  Table,
  TableCreate,
  TableQueryMeta,
  TableUpdate,
} from '#shared/types/api/table';

const TableOps = ModelOps({
  table: tablesTable,
  tableName: 'tablesTable',
  publicSchema: Table,
  selectSchema: TableSelectSchema,
  createSchema: TableCreate,
  updateSchema: TableUpdate,
  queryMetaSchema: TableQueryMeta,
  searchSql: {
    ranking: (
      search,
    ) => sql`setweight(to_tsvector('english', ${tablesTable.name}), 'A') || \
          setweight(to_tsvector('english', ${tablesTable.alias}), 'B') || \
          setweight(to_tsvector('english', coalesce(${tablesTable.description}, '')), 'C'), to_tsquery('english', ${search})`,
    where: (
      search,
    ) => sql`setweight(to_tsvector('english', ${tablesTable.name}), 'A') || \
          setweight(to_tsvector('english', ${tablesTable.alias}), 'B') || \
          setweight(to_tsvector('english', coalesce(${tablesTable.description}, '')), 'C') \
          @@ to_tsquery('english', ${search})`,
  },
});

export class TableModel extends TableOps {
  public static strategies = TableOps.defineStrategies({
    preWrite: {
      differentSideColors: ({ next }) => {
        if (next.side1Color === next.side2Color) {
          throw new StrategyValidationError('Side colors must be different', {
            side1Color: {
              value: next.side1Color,
              errorType: 'Side colors must be different',
            },
            side2Color: {
              value: next.side2Color,
              errorType: 'Side colors must be different',
            },
          });
        }
      },
    },
  });
}
