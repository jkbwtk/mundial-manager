import { query } from '@solidjs/router';
import z from 'zod';
import { trpcClient } from '#flib/trpcClient';
import { Identity } from '#shared/types/api/identity';

export const queryCalculatorUrl = query(async () => {
  const url = await trpcClient.system.calculatorUrl.query();

  return z.url().parse(url);
}, 'queryCalculatorUrl');

export const queryIdentity = query(async () => {
  const identity = await trpcClient.system.identity.query();

  return Identity.parse(identity);
}, 'queryIdentity');
