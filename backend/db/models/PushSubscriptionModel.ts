import type { DB, TX } from '#backend/db/database';
import { ModelOps } from '#backend/db/models/ModelOps';
import { pushSubscriptionsTable } from '#backend/db/schema';
import { environment } from '#backend/environment';
import { PushSubscriptionSelectSchema } from '#backend/types/db/pushSubscription';
import { ConvertDrizzleErrors } from '#blib/modelErrors';
import type { Role } from '#shared/permissions';
import type { PushNotificationType } from '#shared/types/api/pushNotification';
import {
  PushSubscription,
  PushSubscriptionCreate,
  type PushSubscriptionCurrent,
  PushSubscriptionQueryMeta,
  type PushSubscriptionSave,
  PushSubscriptionUpdate,
} from '#shared/types/api/pushSubscription';

export interface PushSubscriptionClient {
  clientUuid: string;
  role: Role;
  expiresAt: Date;
}

const PushSubscriptionOps = ModelOps({
  table: pushSubscriptionsTable,
  tableName: 'pushSubscriptionsTable',
  publicSchema: PushSubscription,
  selectSchema: PushSubscriptionSelectSchema,
  createSchema: PushSubscriptionCreate,
  updateSchema: PushSubscriptionUpdate,
  queryMetaSchema: PushSubscriptionQueryMeta,
});

export class PushSubscriptionModel extends PushSubscriptionOps {
  @ConvertDrizzleErrors()
  public static async getByClientUuid(
    db: DB | TX,
    leagueUuid: string,
    clientUuid: string,
  ) {
    const instance = await db.query.pushSubscriptionsTable.findFirst({
      where: {
        leagueUuid,
        clientUuid,
        $deletedAt: {
          isNull: true,
        },
      },
    });

    return instance ?? null;
  }

  @ConvertDrizzleErrors()
  public static async getByEndpoint(
    db: DB | TX,
    leagueUuid: string,
    endpoint: string,
  ) {
    const instance = await db.query.pushSubscriptionsTable.findFirst({
      where: {
        leagueUuid,
        endpoint,
        $deletedAt: {
          isNull: true,
        },
      },
    });

    return instance ?? null;
  }

  @ConvertDrizzleErrors()
  public static async getAllByNotificationType(
    db: DB | TX,
    leagueUuid: string,
    notificationType: PushNotificationType,
  ) {
    return db.query.pushSubscriptionsTable.findMany({
      where: {
        leagueUuid,
        notificationTypes: {
          arrayContains: [notificationType],
        },
        expiresAt: {
          gt: new Date(),
        },
        $deletedAt: {
          isNull: true,
        },
      },
    });
  }

  @ConvertDrizzleErrors()
  public static async getCurrent(
    db: DB | TX,
    leagueUuid: string,
    clientUuid: string | null,
  ): Promise<PushSubscriptionCurrent> {
    return {
      publicKey: environment.VAPID_PUBLIC_KEY,
      subscription:
        clientUuid === null
          ? null
          : await this.getByClientUuid(db, leagueUuid, clientUuid),
    };
  }

  @ConvertDrizzleErrors()
  public static async refreshClient(
    db: DB | TX,
    leagueUuid: string,
    client: PushSubscriptionClient,
  ) {
    const existing = await this.getByClientUuid(
      db,
      leagueUuid,
      client.clientUuid,
    );

    if (existing === null) return null;

    return this.update(db, leagueUuid, {
      uuid: existing.uuid,
      role: client.role,
      expiresAt: client.expiresAt,
    });
  }

  @ConvertDrizzleErrors()
  public static async save(
    db: DB | TX,
    leagueUuid: string,
    client: PushSubscriptionClient,
    data: PushSubscriptionSave,
  ) {
    return db.transaction(async (tx) => {
      const existing = await this.getByClientUuid(
        tx,
        leagueUuid,
        client.clientUuid,
      );
      const endpointOwner = await this.getByEndpoint(
        tx,
        leagueUuid,
        data.endpoint,
      );

      // A browser that lost its client cookie keeps its endpoint
      if (endpointOwner !== null && endpointOwner.uuid !== existing?.uuid) {
        await this.delete(tx, leagueUuid, endpointOwner.uuid);
      }

      if (existing === null) {
        return this.create(tx, leagueUuid, {
          ...data,
          ...client,
          labels: {},
        });
      }

      return this.update(tx, leagueUuid, {
        uuid: existing.uuid,
        ...data,
        role: client.role,
        expiresAt: client.expiresAt,
      });
    });
  }
}
