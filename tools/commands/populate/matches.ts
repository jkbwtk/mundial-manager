import { randomInt } from 'node:crypto';
import { faker } from '@faker-js/faker';
import { db } from '#backend/db/database';
import { BallModel } from '#backend/db/models/BallModel';
import { MatchEventModel } from '#backend/db/models/MatchEventModel';
import { MatchModel } from '#backend/db/models/MatchModel';
import { PlayerModel } from '#backend/db/models/PlayerModel';
import { TableModel } from '#backend/db/models/TableModel';
import { matchesTable } from '#backend/db/schema';
import { logger } from '#shared/logger';
import {
  nonLinearRandomInt,
  pickRandom,
  pickRandomMultiple,
  pickRandomWeighed,
  runWithProbability,
} from '#shared/random';
import type {
  GoalType,
  MatchEventCreate,
  MatchEventType,
} from '#shared/types/api/matchEvent';
import { MatchSideEnum } from '#shared/types/api/matchEvent';
import { range } from '#shared/utils';
import type { PopulateOptions } from '#tools/commands/populate';

interface MatchEventContext {
  startDate: Date;
  playersSide1: string[];
  playersSide2: string[];
}

interface MatchEventsResult {
  events: MatchEventCreate[];
  side1Score: number;
  side2Score: number;
  duration: number;
  pauseDuration: number;
}

function generateMatchEvents(ctx: MatchEventContext): MatchEventsResult {
  let side1Score = 0;
  let side2Score = 0;

  let currentTime = ctx.startDate.getTime();
  let pauseDuration = 0;

  const events: MatchEventCreate[] = [
    {
      time: new Date(currentTime),
      type: 'MATCH_START',
      matchUuid: '',
    },
  ];

  while (
    (side1Score < 10 && side2Score < 10) ||
    side1Score === side2Score ||
    Math.abs(side1Score - side2Score) < 2
  ) {
    currentTime += nonLinearRandomInt(10000, 120000, 5);

    const eventType: MatchEventType = pickRandomWeighed([
      [0.85, 'GOAL'],
      [0.1, 'BALL_OUT'],
      [0.02, 'POSITION_CHANGE'],
      [0.02, 'EQUIPMENT_FAILURE'],
      [0.01, 'PAUSE'],
    ]);

    switch (eventType) {
      case 'GOAL':
        {
          const scoringSide = pickRandom([
            MatchSideEnum.SIDE_1,
            MatchSideEnum.SIDE_2,
          ]);

          const goalTypes: Set<GoalType> = new Set(
            range(nonLinearRandomInt(0, 4, 2)).map(() =>
              pickRandomWeighed([
                [0.25, 'LONG_SHOT_GOAL'],
                [0.25, 'FAST_GOAL'],
                [0.15, 'PARRY_GOAL'],
                [0.1, 'GUARD_PIERCE_GOAL'],
                [0.1, 'TRICK_SHOT_GOAL'],
                [0.05, 'SLOW_GOAL'],
                [0.03, 'BACK_STAB_GOAL'],
                [0.02, 'AERIAL_GOAL'],
                [0.01, 'BERMUDA_TRIANGLE_GOAL'],
                [0.02, 'RETURN_TO_FIELD_GOAL'],
                [0.02, 'PUSH_GOAL'],
              ]),
            ),
          );

          if (scoringSide === MatchSideEnum.SIDE_1) {
            side1Score += 1;
            events.push({
              time: new Date(currentTime),
              type: 'GOAL',
              matchUuid: '',
              ownGoal: false,
              side: 'SIDE_1',
              goalType: Array.from(goalTypes),
              player: pickRandom(ctx.playersSide1),
            });
          } else {
            side2Score += 1;
            events.push({
              time: new Date(currentTime),
              type: 'GOAL',
              matchUuid: '',
              ownGoal: false,
              side: 'SIDE_2',
              goalType: Array.from(goalTypes),
              player: pickRandom(ctx.playersSide2),
            });
          }
        }
        break;

      case 'BALL_OUT':
        events.push({
          time: new Date(currentTime),
          type: 'BALL_OUT',
          matchUuid: '',
        });
        break;

      case 'POSITION_CHANGE':
        events.push({
          time: new Date(currentTime),
          type: 'POSITION_CHANGE',
          matchUuid: '',
          side: pickRandom([MatchSideEnum.SIDE_1, MatchSideEnum.SIDE_2]),
        });
        break;

      case 'EQUIPMENT_FAILURE':
        events.push({
          time: new Date(currentTime),
          type: 'EQUIPMENT_FAILURE',
          matchUuid: '',
          details:
            runWithProbability(0.7, () => faker.lorem.sentence()) ?? null,
        });
        break;

      case 'PAUSE': {
        events.push({
          time: new Date(currentTime),
          type: 'PAUSE',
          matchUuid: '',
          details:
            runWithProbability(0.7, () => faker.lorem.sentence()) ?? null,
        });

        const pause = nonLinearRandomInt(10000, 180000, 3);

        currentTime += pause;
        pauseDuration += pause;

        events.push({
          time: new Date(currentTime),
          type: 'RESUME',
          matchUuid: '',
        });
        break;
      }

      default:
        break;
    }
  }

  const duration = currentTime - ctx.startDate.getTime();

  return {
    events,
    side1Score,
    side2Score,
    duration: Math.floor(duration / 1000),
    pauseDuration: Math.floor(pauseDuration / 1000),
  };
}

export async function populateMatches(options: PopulateOptions): Promise<void> {
  if (options.clear) {
    logger.info('Clearing existing data from matches...', {
      label: ['cli', 'populate', 'matches'],
    });

    const deletedMatches = await db.delete(matchesTable).returning();

    logger.info('Deleted %d matches', deletedMatches.length, {
      label: ['cli', 'populate', 'matches'],
    });
  }

  logger.info('Populating matches with %d records...', options.count, {
    label: ['cli', 'populate', 'matches'],
  });

  const availableTables = await TableModel.getAll(db, options.leagueUuid);
  const tableUuids = availableTables.map((t) => t.uuid);

  const availableBalls = await BallModel.getAll(db, options.leagueUuid);
  const ballUuids = availableBalls.map((b) => b.uuid);

  const availablePlayers = await PlayerModel.getAll(db, options.leagueUuid);
  const playerUuids = availablePlayers.map((p) => p.uuid);

  if (playerUuids.length < 2) {
    logger.warn('Not enough players to populate matches (need at least 2)', {
      label: ['cli', 'populate', 'matches'],
    });
    return;
  }

  await Promise.all(
    range(options.count).map(async () => {
      const tableUuid = pickRandom(tableUuids);
      const ballUuid = pickRandom(ballUuids);

      const startDate = new Date(
        Date.now() - randomInt(0, 30 * 24 * 60 * 60 * 1000),
      );

      const players = pickRandomMultiple(
        playerUuids,
        randomInt(1, Math.min(2, playerUuids.length - 1) + 1) * 2,
      );

      const playersSide1 = players.slice(0, Math.floor(players.length / 2));
      const playersSide2 = players.slice(Math.floor(players.length / 2));

      const spectators = pickRandomMultiple(
        playerUuids,
        randomInt(0, Math.min(4, playerUuids.length - 2) + 1),
      );

      const eventsResult = generateMatchEvents({
        startDate,
        playersSide1,
        playersSide2,
      });

      const match = await MatchModel.create(db, options.leagueUuid, {
        tableUuid,
        ballUuid,
        startDate,
        duration: eventsResult.duration,
        pauseDuration: eventsResult.pauseDuration,
        side1Score: eventsResult.side1Score,
        side2Score: eventsResult.side2Score,
        playersSide1,
        playersSide2,
        spectators,
        status: 'FINISHED',
      });

      for (const event of eventsResult.events) {
        await MatchEventModel.create(db, options.leagueUuid, {
          ...event,
          matchUuid: match.uuid,
        });
      }
    }),
  );

  logger.info('Finished populating matches', {
    label: ['cli', 'populate', 'matches'],
  });
}
