import { DAY_MS } from '#shared/timeUtils';
import type { Match } from '#shared/types/api/match';
import {
  type CalculatorRemote,
  createSimulatedMatch,
  type SimulatedMatch,
  type SimulatedMatchSetup,
} from './simulatedMatch';

export interface ScenarioContext {
  api: CalculatorRemote;
  setup: SimulatedMatchSetup;

  log: (message: string) => void;
  track: (match: SimulatedMatch) => SimulatedMatch;
}

export interface CalculatorScenario {
  key: string;
  name: string;
  description: string;

  run: (context: ScenarioContext) => Promise<void>;
}

const SYNTHETIC_START_OFFSET_MS = 365 * DAY_MS;

export function expectScenario(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Expectation failed: ${message}`);
}

export async function expectRejection(
  promise: Promise<unknown>,
  errorType: string,
): Promise<void> {
  try {
    await promise;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    expectScenario(
      message.includes(errorType),
      `rejection mentions ${errorType} (got: ${message.slice(0, 200)})`,
    );

    return;
  }

  throw new Error(`Expectation failed: request rejects with ${errorType}`);
}

function createSyntheticClock(start: number): {
  now: () => number;
  advance: (ms: number) => void;
} {
  let time = start;

  return {
    now: () => time,
    advance: (ms) => {
      time += ms;
    },
  };
}

function createScenarioMatch(
  context: ScenarioContext,
  setupOverrides: Partial<SimulatedMatchSetup> = {},
) {
  const clock = createSyntheticClock(Date.now() - SYNTHETIC_START_OFFSET_MS);
  const match = context.track(
    createSimulatedMatch(
      context.api,
      { ...context.setup, ...setupOverrides },
      { now: clock.now },
    ),
  );

  return { match, clock, startDate: new Date(clock.now()) };
}

function expectStatus(match: Match, status: Match['status']): void {
  expectScenario(
    match.status === status,
    `status is ${status} (got ${match.status})`,
  );
}

export const CalculatorScenarios: CalculatorScenario[] = [
  {
    key: 'reference-data',
    name: 'Reference data',
    description: 'Tables, balls, players, goal types, league and season load',
    run: async ({ api, log }) => {
      const [tables, balls, players, goalTypes, league, season] =
        await Promise.all([
          api.getTables(),
          api.getBalls(),
          api.getPlayers(),
          api.getGoalTypes(),
          api.getActiveLeague(),
          api.getCurrentSeason(),
        ]);

      log(
        `${tables.length} tables, ${balls.length} balls, ${players.length} players, ${goalTypes.length} goal types`,
      );
      log(`league: ${league?.name ?? '-'}, season: ${season?.name ?? '-'}`);

      expectScenario(league !== null, 'an active league exists');
      expectScenario(players.length >= 2, 'at least two players exist');
    },
  },
  {
    key: 'live-match',
    name: 'Live match lifecycle',
    description: 'ONGOING, goals, pause and resume, finish with scores synced',
    run: async (context) => {
      const { match, clock, startDate } = createScenarioMatch(context);

      expectStatus(await match.start(startDate), 'ONGOING');

      clock.advance(20_000);
      await match.goal('SIDE_1');
      clock.advance(15_000);
      await match.goal('SIDE_2');
      clock.advance(10_000);
      expectStatus(await match.pause('Equipment'), 'PAUSED');
      clock.advance(30_000);
      expectStatus(await match.resume(), 'ONGOING');
      clock.advance(12_000);
      await match.goal('SIDE_1');
      clock.advance(5_000);
      await match.ballOut();

      const finished = await match.finish();

      expectStatus(finished, 'FINISHED');
      expectScenario(
        finished.side1Score === 2 && finished.side2Score === 1,
        `score is 2:1 (got ${finished.side1Score}:${finished.side2Score})`,
      );
      expectScenario(
        finished.pauseDuration === 30_000,
        `pause duration is 30s (got ${finished.pauseDuration})`,
      );
      expectScenario(
        finished.duration === 62_000,
        `duration excludes the pause (got ${finished.duration})`,
      );
    },
  },
  {
    key: 'table-lock',
    name: 'One live match per table',
    description:
      'A second ONGOING or PAUSED match on the same table is rejected',
    run: async (context) => {
      expectScenario(context.setup.tableUuid !== null, 'a table is selected');

      const first = createScenarioMatch(context);
      const second = createScenarioMatch(context);

      await first.match.start(first.startDate);
      await expectRejection(
        second.match.start(second.startDate),
        'TABLE_IN_USE',
      );

      await first.match.pause();
      await expectRejection(
        second.match.start(second.startDate),
        'TABLE_IN_USE',
      );

      await first.match.resume();
      await first.match.finish();

      expectStatus(await second.match.start(second.startDate), 'ONGOING');
    },
  },
  {
    key: 'surrender',
    name: 'Surrender',
    description: 'SURRENDER event derives SURRENDERED, the other side wins',
    run: async (context) => {
      const { match, clock, startDate } = createScenarioMatch(context);

      await match.start(startDate);
      clock.advance(10_000);
      await match.goal('SIDE_2');
      clock.advance(10_000);

      const surrendered = await match.surrender('SIDE_2');

      expectStatus(surrendered, 'SURRENDERED');
      expectScenario(
        surrendered.duration !== null,
        'surrendered match has a duration',
      );
    },
  },
  {
    key: 'surrender-without-event',
    name: 'Surrender requires event',
    description: 'Setting SURRENDERED without a timeline event is rejected',
    run: async (context) => {
      const { match, startDate } = createScenarioMatch(context);
      const started = await match.start(startDate);

      await expectRejection(
        context.api.updateMatch({ uuid: started.uuid, status: 'SURRENDERED' }),
        'SURRENDER_EVENT_MISSING',
      );

      await match.finish();
    },
  },
  {
    key: 'cancel',
    name: 'Cancel',
    description: 'CANCEL event derives CANCELED',
    run: async (context) => {
      const { match, clock, startDate } = createScenarioMatch(context);

      await match.start(startDate);
      clock.advance(5_000);

      expectStatus(await match.cancel('Simulator'), 'CANCELED');
    },
  },
  {
    key: 'schedule-start',
    name: 'Schedule and start',
    description: 'SCHEDULED match is listed by filters, then started',
    run: async (context) => {
      const { match, startDate } = createScenarioMatch(context);
      const scheduled = await match.schedule(new Date(Date.now() + DAY_MS));

      expectStatus(scheduled, 'SCHEDULED');

      const upcoming = await context.api.getMatches({
        filters: {
          status: ['SCHEDULED'],
          tableUuid: context.setup.tableUuid ?? undefined,
        },
        sorting: { field: 'startDate', direction: 'asc' },
      });

      expectScenario(
        upcoming.data.some((entry) => entry.uuid === scheduled.uuid),
        'scheduled match is returned by the status and table filters',
      );

      expectStatus(await match.start(startDate), 'ONGOING');
      await match.finish();
    },
  },
  {
    key: 'resume',
    name: 'Resume ongoing match',
    description: 'A fresh calculator finds its live match by status and table',
    run: async (context) => {
      const { match, clock, startDate } = createScenarioMatch(context);
      const started = await match.start(startDate);

      clock.advance(5_000);
      await match.goal('SIDE_1');

      const found = await context.api.getMatches({
        filters: {
          status: ['ONGOING', 'PAUSED'],
          tableUuid: context.setup.tableUuid ?? undefined,
        },
      });

      expectScenario(
        found.data.length === 1 && found.data[0]?.uuid === started.uuid,
        `exactly the live match is found (got ${found.data.length})`,
      );

      await match.finish();
    },
  },
  {
    key: 'rematch',
    name: 'Rematch lineup',
    description: 'Latest finished match on the table returns the same lineup',
    run: async (context) => {
      const { match, clock, startDate } = createScenarioMatch(context);
      const started = await match.start(startDate);

      clock.advance(5_000);
      await match.finish();

      const latest = await context.api.getMatches({
        filters: {
          status: ['FINISHED'],
          tableUuid: context.setup.tableUuid ?? undefined,
          playerUuid: context.setup.playersSide1[0],
          from: startDate.getTime(),
          to: startDate.getTime() + DAY_MS,
        },
        sorting: { field: 'startDate', direction: 'desc' },
        pagination: { limit: 1, offset: 0 },
      });
      const last = latest.data[0];

      expectScenario(
        last?.uuid === started.uuid,
        'latest match is the one just played',
      );
      expectScenario(
        last !== undefined &&
          last.playersSide1.join() === context.setup.playersSide1.join() &&
          last.playersSide2.join() === context.setup.playersSide2.join(),
        'lineup matches',
      );
    },
  },
  {
    key: 'preview',
    name: 'Match preview',
    description: 'Preview returns prediction, head-to-head and player form',
    run: async ({ api, setup, log }) => {
      const preview = await api.getMatchPreview({
        playersSide1: setup.playersSide1,
        playersSide2: setup.playersSide2,
      });
      const { wins, draws, losses } = preview.headToHead;

      log(`head-to-head ${wins}W ${draws}D ${losses}L`);
      log(`goal share ${preview.prediction?.goalShare.toFixed(3) ?? '-'}`);

      expectScenario(
        preview.players.length ===
          setup.playersSide1.length + setup.playersSide2.length,
        'form is returned for every player',
      );
    },
  },
  {
    key: 'filters',
    name: 'Query filters',
    description: 'Status, player and date range filters and sorting',
    run: async ({ api, setup }) => {
      const now = Date.now();
      const [all, finished, player, range] = await Promise.all([
        api.getMatches({ pagination: { limit: 1, offset: 0 } }),
        api.getMatches({ filters: { status: ['FINISHED'] } }),
        api.getMatches({ filters: { playerUuid: setup.playersSide1[0] } }),
        api.getMatches({ filters: { from: now - DAY_MS, to: now + DAY_MS } }),
      ]);

      expectScenario(
        finished.data.every((match) => match.status === 'FINISHED'),
        'status filter',
      );
      expectScenario(
        player.data.every(
          (match) =>
            match.playersSide1.includes(setup.playersSide1[0]!) ||
            match.playersSide2.includes(setup.playersSide1[0]!),
        ),
        'player filter matches both sides',
      );
      expectScenario(
        range.data.every(
          (match) =>
            match.startDate !== null &&
            match.startDate.getTime() >= now - DAY_MS &&
            match.startDate.getTime() < now + DAY_MS,
        ),
        'date range filter',
      );
      expectScenario(finished.total <= all.total, 'filtered totals');
    },
  },
];
