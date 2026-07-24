import { connect, type Options } from 'amqplib';
import { environment } from '#backend/environment';

export type SupportedAMQPQueue = Options.AssertQueue & {
  name: string;
};

export const AMQP_QUEUES = [
  {
    name: 'DB_UPDATES',
    arguments: {
      'x-queue-type': 'quorum',
    },
  },
] as const satisfies SupportedAMQPQueue[];

export type AMQP_QUEUE_NAMES = (typeof AMQP_QUEUES)[number]['name'];

let amqpSingleton: ReturnType<typeof initializeAMQPChannel> | null = null;

async function initializeAMQPChannel() {
  const amqpConnection = await connect({
    hostname: environment.RABBITMQ_HOST,
    port: environment.RABBITMQ_PORT,
    username: environment.RABBITMQ_USER,
    password: environment.RABBITMQ_PASS,
  });

  const amqpChannel = await amqpConnection.createChannel();

  for (const { name, ...queue } of AMQP_QUEUES) {
    await amqpChannel.assertQueue(name, queue);
  }

  return { amqpConnection, amqpChannel };
}

export async function getAMQPChannel() {
  if (amqpSingleton === null) {
    amqpSingleton = initializeAMQPChannel();
  }

  return (await amqpSingleton).amqpChannel;
}
