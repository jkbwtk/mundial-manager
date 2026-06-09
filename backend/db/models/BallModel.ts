import { and, desc, eq, getColumns, isNull, sql } from 'drizzle-orm';
import type { DB } from '#backend/db/database';
import { ModelOps } from '#backend/db/models/ModelOps';
import { ballsTable } from '#backend/db/schema';
import { BallSelectSchema } from '#backend/types/db/ball';
import { BallCreate, BallQueryMeta, BallUpdate } from '#shared/types/api/ball';

export class BallModel extends ModelOps({
  table: ballsTable,
  tableName: 'ballsTable',
  selectSchema: BallSelectSchema,
  createSchema: BallCreate,
  updateSchema: BallUpdate,
  queryMetaSchema: BallQueryMeta,
}) {
  public static async search(db: DB, leagueUuid: string, query: string) {
    if (!query.trim()) {
      return this.getAll(db, leagueUuid, {
        pagination: {
          limit: 10,
          offset: 0,
        },
      });
    }

    const matchQuery = sql`setweight(to_tsvector('english', ${ballsTable.name}), 'A') || \
          setweight(to_tsvector('english', ${ballsTable.alias}), 'B') || \
          setweight(to_tsvector('english', coalesce(${ballsTable.description}, '')), 'C'), to_tsquery('english', ${query})`;

    const instances = await db
      .select({
        ...getColumns(ballsTable),
        rank: sql`ts_rank(${matchQuery})`,
      })
      .from(ballsTable)
      .where(
        and(
          eq(ballsTable.leagueUuid, leagueUuid),
          isNull(ballsTable.$deletedAt),
          sql`setweight(to_tsvector('english', ${ballsTable.name}), 'A') || \
          setweight(to_tsvector('english', ${ballsTable.alias}), 'B') || \
          setweight(to_tsvector('english', coalesce(${ballsTable.description}, '')), 'C') \
          @@ to_tsquery('english', ${query})`,
        ),
      )
      .orderBy((t) => desc(t.rank))
      .limit(10);

    return instances;
  }
}
