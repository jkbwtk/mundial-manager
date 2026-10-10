import { randomUUID } from 'node:crypto';
import type { Channel } from '#backend/amqp/amqp';
import {
  deserializeAMQPMessage,
  getTransportDelay,
  serializeAMQPMessage,
} from '#backend/amqp/publishers';
import type { DB } from '#backend/db/database';
import { StatsFrameModel } from '#backend/db/models/StatsFrameModel';
import { StatsInvalidation } from '#backend/types/statsInvalidation';
import { logger } from '#shared/logger';
import { shortUUID } from '#shared/utils';

export async function registerStatsInvalidation(
  channel: Channel,
  db: DB,
): Promise<void> {
  await channel.prefetch(1);

  await channel.consume('STATS_INVALIDATION', async (msg) => {
    if (msg === null) return;

    logger.debug(
      'Consuming message %s',
      msg.properties.messageId ?? 'unknown',
      { label: ['consumers', 'statsInvalidation'] },
    );

    const message = deserializeAMQPMessage(StatsInvalidation, msg.content);

    if (message === null) {
      logger.warn('Acknowledging malformed message', {
        label: ['consumers', 'statsInvalidation'],
      });

      channel.ack(msg);
      return;
    }

    logger.debug('AMQP transport delay: %d', getTransportDelay(message), {
      label: ['consumers', 'statsInvalidation'],
    });

    try {
      const processed = await StatsFrameModel.recalculate(
        db,
        message.leagueUuid,
        message.data,
      );

      logger.info(
        'Recalculated stats of %d matches for league %s',
        processed,
        message.leagueUuid,
        { label: ['consumers', 'statsInvalidation'] },
      );
    } catch (err) {
      logger.error(
        'Failed to recalculate stats for league %s',
        message.leagueUuid,
        { label: ['consumers', 'statsInvalidation'], error: err },
      );
    }

    channel.ack(msg);
  });
}

export async function enqueueStaleStatsInvalidations(
  channel: Channel,
  db: DB,
): Promise<void> {
  const leagueUuids = await StatsFrameModel.getStaleLeagueUuids(db);

  for (const leagueUuid of leagueUuids) {
    const messageId = ['worker', 'staleStats', shortUUID(randomUUID())].join(
      ':',
    );

    logger.info(
      'Enqueueing stale stats recalculation for league %s',
      leagueUuid,
      {
        label: ['consumers', 'statsInvalidation'],
      },
    );

    channel.sendToQueue(
      'STATS_INVALIDATION',
      serializeAMQPMessage(leagueUuid, {
        source: 'LEAGUE',
        uuid: leagueUuid,
      } satisfies StatsInvalidation),
      { messageId },
    );
  }
}
