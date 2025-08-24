import { initTRPC } from '@trpc/server';
import { z } from 'zod';


const t = initTRPC.create();
 
export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  add: publicProcedure.input(z.object(({
    a: z.number(),
    b: z.number()
  }))).query(({input}) => {

    return input.a + input.b;
  })
});
 
export type AppRouter = typeof appRouter;