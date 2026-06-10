import { sql } from 'drizzle-orm';
import {
  ModelOps,
  type ValidationStrategies,
} from '#backend/db/models/ModelOps';
import { tablesTable } from '#backend/db/schema';
import { TableSelectSchema } from '#backend/types/db/table';
import { StrategyValidationError } from '#blib/modelErrors';
import {
  TableCreate,
  TableQueryMeta,
  TableStrategy,
  TableUpdate,
} from '#shared/types/api/table';

export class TableModel extends ModelOps({
  table: tablesTable,
  tableName: 'tablesTable',
  selectSchema: TableSelectSchema,
  createSchema: TableCreate,
  updateSchema: TableUpdate,
  queryMetaSchema: TableQueryMeta,
  strategySchema: TableStrategy,
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
}) {
  public static validationStrategies: ValidationStrategies<
    typeof TableStrategy
  > = {
    differentSideColors: (_db, _leagueUuid, data) => {
      if (data.side1Color === data.side2Color) {
        throw new StrategyValidationError('Side colors must be different', {
          side1Color: {
            value: data.side1Color,
            errorType: 'Side colors must be different',
          },
          side2Color: {
            value: data.side2Color,
            errorType: 'Side colors must be different',
          },
        });
      }
    },
  };
}
