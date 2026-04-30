import { tracked } from '@trpc/server';
import z from 'zod';
import { zodEncode } from '#backend/lib/utils';
import { SheetStore } from '#backend/SheetStore';
import { restrictedProcedure, router } from '#backend/trpc';
import { MatchCreate, type SheetMetadata } from '#shared/types/Sheets';

const sheetStore = new SheetStore();
sheetStore.initialize();

export const sheetProcedure = restrictedProcedure.use((opts) => {
  return opts.next({
    ctx: { sheetStore, ...opts.ctx },
  });
});

export const sheetsRouter = router({
  metadata: sheetProcedure.query(async ({ ctx }): Promise<SheetMetadata> => {
    const store = await ctx.sheetStore.getInitialized();

    return {
      title: store.doc.title,
      timezone: store.doc.timeZone,
      locale: store.doc.locale,
      rows: store.sheet.rowCount,
      columns: store.sheet.columnCount,
    };
  }),
  matches: sheetProcedure.query(async ({ ctx }) => {
    const store = await ctx.sheetStore.getInitialized();

    return store.getMatches();
  }),
  createMatch: sheetProcedure
    .input(zodEncode(MatchCreate))
    .mutation(async ({ ctx, input: match }) => {
      const store = await ctx.sheetStore.getInitialized();

      return store.createMatch(match);
    }),
  createMatches: sheetProcedure
    .input(zodEncode(z.array(MatchCreate)))
    .mutation(async ({ ctx, input: matches }) => {
      const store = await ctx.sheetStore.getInitialized();

      return store.createMatches(matches);
    }),
  onMatchAdded: sheetProcedure
    .input(
      z.object({ lastEventId: z.coerce.number().int().nullish() }).optional(),
    )
    .subscription(async function* (opts) {
      const store = await opts.ctx.sheetStore.getInitialized();
      const lastEventId = opts.input?.lastEventId;

      const iterator = store.matchesEmitter.toIterable('matchCreated', {
        signal: opts.signal,
      });

      if (lastEventId) {
        const localMatches = store
          .getLocalMatches()
          .filter((match) => match.id > lastEventId);

        for (const match of localMatches) {
          yield tracked(String(match.id), match);
        }
      }

      for await (const [match] of iterator) {
        yield tracked(String(match.id), match);
      }
    }),
});
