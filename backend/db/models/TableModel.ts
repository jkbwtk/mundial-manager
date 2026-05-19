import { and, count, eq, isNull } from 'drizzle-orm';
import type { DB, TX } from '#backend/db/database';
import { Model } from '#backend/db/models/Model';
import { tablesTable } from '#backend/db/schema';
import type { TableSelectSchema } from '#backend/types/db/table';
import {
  ConvertDrizzleErrors,
  DatabaseError,
  NotFoundError,
  StrategyValidationError,
} from '#blib/modelErrors';
import {
  Table,
  type TableCreate,
  type TableStrategy,
  type TableUpdate,
} from '#shared/types/api/table';

export class TableModel extends Model<TableSelectSchema, typeof Table> {
  protected publicSchema = Table;

  public get uuid() {
    return this.instance.uuid;
  }

  @ConvertDrizzleErrors('TableModel')
  public static async create(db: DB, leagueUuid: string, data: TableCreate) {
    for (const strategy of Object.values(TableModel.validationStrategies)) {
      await strategy(db, leagueUuid, data);
    }

    const [table] = await db
      .insert(tablesTable)
      .values({ ...data, leagueUuid })
      .returning();

    if (!table) {
      throw new DatabaseError('Failed to create table', {});
    }

    return new TableModel(db, table);
  }

  @ConvertDrizzleErrors('TableModel')
  public static async update(db: DB, leagueUuid: string, data: TableUpdate) {
    const { uuid, ...updateData } = data;

    const table = await db.transaction(async (tx) => {
      const existingTable = await TableModel._getById(tx, uuid);
      if (!existingTable) {
        throw new NotFoundError('Table not found for update', {
          uuid: { value: uuid, errorType: 'Table not found' },
        });
      }

      const mergedData: TableStrategy = {
        ...existingTable,
        ...updateData,
      };

      for (const strategy of Object.values(TableModel.validationStrategies)) {
        await strategy(tx, leagueUuid, mergedData);
      }

      const [table] = await tx
        .update(tablesTable)
        .set(updateData)
        .where(
          and(
            eq(tablesTable.leagueUuid, leagueUuid),
            eq(tablesTable.uuid, uuid),
            isNull(tablesTable.$deletedAt),
          ),
        )
        .returning();

      if (!table) {
        throw new DatabaseError('Failed to update table', {
          uuid: { value: uuid, errorType: 'Table not found' },
        });
      }

      return table;
    });

    return new TableModel(db, table);
  }

  @ConvertDrizzleErrors('TableModel')
  public static async delete(db: DB, leagueUuid: string, uuid: string) {
    const [table] = await db
      .update(tablesTable)
      .set({ $deletedAt: new Date() })
      .where(
        and(
          eq(tablesTable.leagueUuid, leagueUuid),
          eq(tablesTable.uuid, uuid),
          isNull(tablesTable.$deletedAt),
        ),
      )
      .returning();

    if (!table) {
      throw new DatabaseError('Failed to delete table', {
        uuid: { value: uuid, errorType: 'Table not found' },
      });
    }

    return new TableModel(db, table);
  }

  public static async _getById(db: DB | TX, uuid: string) {
    const table = await db.query.tablesTable.findFirst({
      where: {
        uuid,
        $deletedAt: {
          isNull: true,
        },
      },
    });

    return table ?? null;
  }

  @ConvertDrizzleErrors('TableModel')
  public static async getById(db: DB, uuid: string) {
    const table = await TableModel._getById(db, uuid);

    if (!table) {
      return null;
    }

    return new TableModel(db, table);
  }

  @ConvertDrizzleErrors('TableModel')
  public static async getAll(
    db: DB,
    leagueUuid: string,
    limit?: number,
    offset?: number,
  ) {
    const tables = await db.query.tablesTable.findMany({
      where: {
        leagueUuid,
        $deletedAt: {
          isNull: true,
        },
      },
      limit,
      offset,
    });

    return tables.map((table) => new TableModel(db, table));
  }

  @ConvertDrizzleErrors('TableModel')
  public static async count(db: DB, leagueUuid: string) {
    const result = await db
      .select({
        count: count(),
      })
      .from(tablesTable)
      .where(
        and(
          eq(tablesTable.leagueUuid, leagueUuid),
          isNull(tablesTable.$deletedAt),
        ),
      );

    return Number(result[0]?.count ?? 0);
  }

  public static validationStrategies = {
    differentSideColors: (
      _db: DB | TX,
      _leagueUuid: string,
      data: TableStrategy,
    ) => {
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
