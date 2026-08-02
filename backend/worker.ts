import { getAMQPChannel } from '#backend/amqp/amqp';
import { registerMatchTableUpdates } from '#backend/amqp/consumers/matchTableUpdates';
import { environment } from '#backend/environment';
import { logger } from '#shared/logger';

async function main() {
  console.log(environment.RABBITMQ_ENABLED);

  if (environment.RABBITMQ_ENABLED === false) {
    logger.info('RabbitMQ disabled, skipping worker initialization', {
      label: ['worker'],
    });

    return setTimeout(() => {}, 999999999);
  }

  logger.info('Starting worker, initializing AMQP channel', {
    label: ['worker'],
  });

  const amqp = await getAMQPChannel();

  logger.info('Worker AMQP channel established', {
    label: ['worker'],
  });

  registerMatchTableUpdates(amqp);
}

main().catch((err) => {
  logger.error('Mundial Manager worker error', {
    label: ['worker'],
    error: err,
  });
});
