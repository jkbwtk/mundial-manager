import type { DB } from '#backend/db/database';
import { Model } from '#backend/db/models/Model';
import { tablesTable } from '#backend/db/schema';
import type { TableSelectSchema } from '#backend/types/db/table';
import { Table, type TableCreate } from '#shared/types/api/table';

export class TableModel extends Model<TableSelectSchema, typeof Table> {
  protected publicSchema = Table;

  public static async create(db: DB, leagueUuid: string, data: TableCreate) {
    const [table] = await db
      .insert(tablesTable)
      .values({ ...data, leagueUuid })
      .returning();

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
