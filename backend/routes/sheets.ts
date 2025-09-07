import { SheetStore } from '#backend/SheetStore';
import { procedure, router } from '#backend/trpc';
import { MatchCreate, type SheetMetadata } from '#shared/types/Sheets';

const sheetStore = new SheetStore();
sheetStore.initialize();

export const sheetProcedure = procedure.use((opts) => {
  return opts.next({
    ctx: { sheetStore },
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
  match: sheetProcedure
    .input(MatchCreate)
    .mutation(async ({ ctx, input: match }) => {
      const store = await ctx.sheetStore.getInitialized();

      return store.createMatch(match);
    }),
});
