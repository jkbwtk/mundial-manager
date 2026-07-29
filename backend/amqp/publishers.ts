/** biome-ignore-all lint/suspicious/noExplicitAny: yeah */

import { randomUUID } from 'node:crypto';
import z, { prettifyError } from 'zod';
import { type AMQP_QUEUE_NAMES, getAMQPChannel } from '#backend/amqp/amqp';
import { logger } from '#shared/logger';
import { shortUUID } from '#shared/utils';

interface AMQPMessage<T extends object> {
  data: T;
  timeOrigin: number;
  serializationTimestamp: number;
  deserializationTimestamp: number | null;
}

export function serializeAMQPMessage<T extends object>(
  data: T,
): Buffer<ArrayBuffer> {
  return Buffer.from(
    JSON.stringify({
      data,
      timeOrigin: performance.timeOrigin,
      serializationTimestamp: performance.now(),
      deserializationTimestamp: null,
    } satisfies AMQPMessage<T>),
  );
}

export function deserializeAMQPMessage<T extends z.ZodObject>(
  schema: T,
  data: Buffer<ArrayBufferLike>,
): AMQPMessage<z.infer<T>> | null {
  const raw = JSON.parse(data.toString());
  const parsed = z
    .object({
      data: schema,
      timeOrigin: z.number(),
      serializationTimestamp: z.number(),
      deserializationTimestamp: z.number().nullable(),
    })
    .safeParse(raw);

  if (parsed.success) {
    parsed.data.deserializationTimestamp = performance.now();

    return parsed.data as AMQPMessage<z.infer<T>>;
  }

  logger.warn(
    'Failed to deserialize AMQP message, %s',
    prettifyError(parsed.error),
    {
      label: ['amqp', 'publishers', 'deserializeAMQPMessage'],
    },
  );

  return null;
}

export function getTransportDelay(message: AMQPMessage<object>): number {
  if (message.deserializationTimestamp === null) {
    logger.warn("Message doesn't have deserializationTimestamp set", {
      label: ['amqp', 'publishers', 'getTransportDelay'],
    });

    return 0;
  }

  const dt = message.timeOrigin - performance.timeOrigin;

  return message.deserializationTimestamp - message.serializationTimestamp - dt;
}

export function PublishResult(queue: AMQP_QUEUE_NAMES) {
  return <T extends (...args: any[]) => any>(
    target: T,
    _ctx: ClassMemberDecoratorContext,
  ) => {
    const wrappedMethod = async function (this: any, ...args: unknown[]) {
      const label = this.name ?? 'unknown';
      const name = 'realName' in target ? target.realName : target.name;

      const resp = await target.call(this, ...args);

      try {
        const amqp = await getAMQPChannel();
        amqp.sendToQueue(queue, serializeAMQPMessage(resp), {
          messageId: [label, name, shortUUID(randomUUID())].join(':'),
        });
      } catch (err) {
        logger.warn('Failed to publish call result to %s queue', queue, {
          label: [label, name],
          error: err,
        });
      }

      return resp;
    };

    if (!('realName' in target)) {
      wrappedMethod.realName = target.name;
    }

    return wrappedMethod;
  };
}
