import {
  createTRPCClient,
  httpBatchLink,
  httpBatchStreamLink,
  httpSubscriptionLink,
  loggerLink,
  retryLink,
  splitLink,
} from '@trpc/client';
import { isServer } from 'solid-js/web';
import type { AppRouter } from '#backend/routers/trpc/app';
import { ssrLink } from '#flib/trpc';
import { isDev } from '#flib/utils';

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      enabled: isDev,
    }),
    splitLink({
      condition: () => isServer,
      true: ssrLink(),
      false: splitLink({
        condition: (op) => op.type === 'subscription',
        true: [
          retryLink({
            retry: (opts) => {
              const code = opts.error.data?.code;

              if (
                code &&
                ['TIMEOUT', 'GATEWAY_TIMEOUT'].includes(code) === false
              ) {
                return false;
              }

              if (opts.attempts > 120) {
                console.warn(
                  `tRPC subscription max retries reached for ${opts.op.path}`,
                );
                return false;
              }

              if (isDev()) {
                console.log(
                  `tRPC subscription reconnecting (attempt ${opts.attempts})`,
                );
              }

              return true;
            },
            retryDelayMs: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
          }),
          httpSubscriptionLink({
            url: '/trpc',
          }),
        ],
        false: [
          retryLink({
            retry: (opts) => {
              if (
                opts.error.data &&
                opts.error.data.code === 'INTERNAL_SERVER_ERROR'
              ) {
                return false;
              }

              if (opts.op.type === 'mutation') {
                return false;
              }

              return opts.attempts <= 3;
            },
            retryDelayMs: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
          }),
          splitLink({
            condition: (op) => op.path.endsWith('$'),
            true: httpBatchLink({
              url: '/trpc',
            }),
            false: httpBatchStreamLink({
              url: '/trpc',
            }),
          }),
        ],
      }),
    }),
  ],
});
