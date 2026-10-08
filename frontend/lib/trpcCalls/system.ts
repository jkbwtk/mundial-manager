import { query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import { Identity } from '#shared/types/api/identity';

export const queryIdentity = query(async () => {
  const identity = await trpcClient.system.identity.query();

  return Identity.parse(identity);
}, 'queryIdentity');
