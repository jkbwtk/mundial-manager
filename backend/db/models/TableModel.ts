import type { DB } from '#backend/db/database';
import { Model } from '#backend/db/models/Model';
import { tablesTable } from '#backend/db/schema';
import {
  TableInsertSchema,
  TablePublicSchema,
  type TableSelectSchema,
} from '#backend/types/db/table';

export class TableModel extends Model<
  TableSelectSchema,
  typeof TablePublicSchema
> {
  protected publicSchema = TablePublicSchema;

  public static async create(db: DB, data: TableInsertSchema) {
    const parsedData = TableInsertSchema.parse(data);

    const [table] = await db.insert(tablesTable).values(parsedData).returning();

    if (!table) {
      throw new Error('Failed to create table');
    }

    return new TableModel(db, table);
  }

  public static async getById(db: DB, uuid: string) {
    const table = await db.query.tablesTable.findFirst({
      where: {
        uuid,
        $deletedAt: {
          isNull: true,
        },
      },
    });

    if (!table) {
      return null;
    }

    return new TableModel(db, table);
  }

  public static async getAll(db: DB, leagueUuid: string) {
    const tables = await db.query.tablesTable.findMany({
      where: {
        leagueUuid,
        $deletedAt: {
          isNull: true,
        },
      },
    });

    return tables.map((table) => new TableModel(db, table));
  }
}
