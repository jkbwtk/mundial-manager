import { AsyncLocalStorage } from 'node:async_hooks';
import {
  type Channel as BaseChannel,
  type ConsumeMessage,
  connect,
  type GetMessage,
  type Options,
  type Replies,
} from 'amqplib';
import { environment } from '#backend/environment';
import { ConfigurationAssertionError } from '#backend/errors/configuration';

export type SupportedAMQPQueue = Options.AssertQueue & {
  name: string;
};

export const AMQP_QUEUES = [
  {
    name: 'MATCH_TABLE_UPDATES',
    arguments: {
      'x-queue-type': 'quorum',
    },
  },
] as const satisfies SupportedAMQPQueue[];

export type AMQP_QUEUE_NAMES = (typeof AMQP_QUEUES)[number]['name'];

export type Channel = Omit<
  BaseChannel,
  | 'assertQueue'
  | 'checkQueue'
  | 'deleteQueue'
  | 'purgeQueue'
  | 'bindQueue'
  | 'unbindQueue'
  | 'sendToQueue'
  | 'consume'
  | 'get'
> & {
  assertQueue(
    queue?: AMQP_QUEUE_NAMES | (string & {}),
    options?: Options.AssertQueue,
  ): Promise<Replies.AssertQueue>;
  checkQueue(queue: string): Promise<Replies.AssertQueue>;

  deleteQueue(
    queue: AMQP_QUEUE_NAMES | (string & {}),
    options?: Options.DeleteQueue,
  ): Promise<Replies.DeleteQueue>;
  purgeQueue(queue: string): Promise<Replies.PurgeQueue>;

  bindQueue(
    queue: AMQP_QUEUE_NAMES | (string & {}),
    source: string,
    pattern: string,
    // biome-ignore lint/suspicious/noExplicitAny: yeah
    args?: any,
  ): Promise<Replies.Empty>;
  unbindQueue(
    queue: AMQP_QUEUE_NAMES | (string & {}),
    source: string,
    pattern: string,
    // biome-ignore lint/suspicious/noExplicitAny: yeah
    args?: any,
  ): Promise<Replies.Empty>;

  sendToQueue(
    queue: AMQP_QUEUE_NAMES | (string & {}),
    content: Buffer,
    options?: Options.Publish,
  ): boolean;

  consume(
    queue: AMQP_QUEUE_NAMES | (string & {}),
    onMessage: (msg: ConsumeMessage | null) => void,
    options?: Options.Consume,
  ): Promise<Replies.Consume>;

  get(queue: string, options?: Options.Get): Promise<GetMessage | false>;
};

let amqpSingleton: ReturnType<typeof initializeAMQPChannel> | null = null;

async function initializeAMQPChannel() {
  if (environment.RABBITMQ_ENABLED === false) {
    throw new ConfigurationAssertionError(
      'initializeAMQPChannel called despite RABBITMQ_ENABLED being set to false',
    );
  }

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

export async function getAMQPChannel(): Promise<Channel> {
  if (amqpSingleton === null) {
    amqpSingleton = initializeAMQPChannel();
  }

  return (await amqpSingleton).amqpChannel;
}

const localStorage = new AsyncLocalStorage();

export function isAMQPEnabled(): boolean {
  const forceDisable = localStorage.getStore() ?? false;

  if (forceDisable) return false;

  return environment.RABBITMQ_ENABLED;
}

export function runWithAMQPDisabled<R>(callback: (...args: unknown[]) => R) {
  return localStorage.run(true, callback) as R;
}
