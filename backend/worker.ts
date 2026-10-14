import { getAMQPChannel } from '#backend/amqp/amqp';
import { environment } from '#backend/environment';
import { logger } from '#shared/logger';

async function main() {
  if (environment.RABBITMQ_ENABLED === false) {
    logger.info('RabbitMQ disabled, skipping worker initialization', {
      label: ['worker'],
    });

    return setTimeout(() => {}, 999999999);
  }

  logger.info('Starting worker, initializing AMQP channel', {
    label: ['worker'],
  });

  await getAMQPChannel();

  logger.info('Worker AMQP channel established', {
    label: ['worker'],
  });
}

main().catch((err) => {
  logger.error('Mundial Manager worker error', {
    label: ['worker'],
    error: err,
  });
});
