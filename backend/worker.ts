import { type AMQP_QUEUE_NAMES, getAMQPChannel } from '#backend/amqp/amqp';
import { logger } from '#shared/logger';

async function main() {
  logger.info('Starting worker, initializing AMQP channel', {
    label: ['worker'],
  });

  const amqp = await getAMQPChannel();

  logger.info('Worker AMQP channel established', {
    label: ['worker'],
  });

  console.log(await amqp.checkQueue('DB_UPDATES' satisfies AMQP_QUEUE_NAMES));
}

main().catch((err) => {
  logger.error('Mundial Manager worker error', {
    label: ['worker'],
    error: err,
  });
});
