import { getAMQPChannel } from '#backend/amqp/amqp';
import { logger } from '#shared/logger';

async function main() {
  logger.info('Starting worker, initializing AMQP channel', {
    label: ['worker'],
  });

  const amqp = await getAMQPChannel();

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
