import type { Channel } from '#backend/amqp/amqp';
import {
  deserializeAMQPMessage,
  getTransportDelay,
} from '#backend/amqp/publishers';
import type { DB } from '#backend/db/database';
import { logger } from '#shared/logger';
import { Match } from '#shared/types/api/match';

export function registerMatchTableUpdates(channel: Channel, db: DB) {
  channel.consume('MATCH_TABLE_UPDATES', (msg) => {
    if (msg === null) {
      return;
    }

    if (msg.properties.messageId) {
      logger.debug('Consuming message %s', msg.properties.messageId, {
        label: ['consumers', 'matchTableUpdates'],
      });
    }

    const message = deserializeAMQPMessage(Match, msg.content);

    if (message === null) {
      logger.warn('Acknowledging malformed message', {
        label: ['consumers', 'matchTableUpdates'],
      });

      channel.ack(msg);
      return;
    }

    const delay = getTransportDelay(message);

    logger.debug('AMQP transport delay: %d', delay, {
      label: ['consumers', 'matchTableUpdates'],
    });

    channel.ack(msg);
  });
}
