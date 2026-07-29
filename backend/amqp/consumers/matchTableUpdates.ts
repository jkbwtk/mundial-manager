import type { Channel } from '#backend/amqp/amqp';
import {
  deserializeAMQPMessage,
  getTransportDelay,
} from '#backend/amqp/publishers';
import { logger } from '#shared/logger';
import { Match } from '#shared/types/api/match';

export function registerMatchTableUpdates(channel: Channel) {
  channel.consume('MATCH_TABLE_UPDATES', (msg) => {
    if (msg === null) {
      return;
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

    logger.debug('AMQP transport delay: %d', delay);

    channel.ack(msg);
  });
}
