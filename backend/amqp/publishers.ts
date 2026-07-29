/** biome-ignore-all lint/suspicious/noExplicitAny: yeah */

import z, { prettifyError } from 'zod';
import { logger } from '#shared/logger';

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
