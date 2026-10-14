import { randomInt } from 'node:crypto';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';
import { db } from '#backend/db/database';
import { BallModel } from '#backend/db/models/BallModel';
import { GoalTypeModel } from '#backend/db/models/GoalTypeModel';
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
  MatchEventCreate,
  MatchEventType,
} from '#shared/types/api/matchEvent';
import { MatchSideEnum } from '#shared/types/api/matchEvent';
import { range } from '#shared/utils';
import type { PopulateOptions } from '#tools/commands/populate';

interface MatchEventContext {
  playersSide1: string[];
  playersSide2: string[];

  goalTypeProbabilities: [probability: number, uuid: string][];
}

const GoalTypeKeyProbabilities: Record<string, number> = {
  LONG_SHOT_GOAL: 0.1533,
  PARRY_GOAL: 0.0967,
  RICOCHET_GOAL: 0.0515,
  FAST_GOAL: 0.0514,
  TRICK_SHOT_GOAL: 0.0324,
  SLOW_GOAL: 0.0318,
  BACK_STAB_GOAL: 0.0297,
  GUARD_PIERCE_GOAL: 0.0257,
  PUSH_GOAL: 0.0176,
  AERIAL_GOAL: 0.0068,
  RETURN_TO_FIELD_GOAL: 0.0058,
  BERMUDA_TRIANGLE_GOAL: 0.0032,
};

const DEFAULT_GOAL_TYPE_PROBABILITY = 0.01;

interface MatchEventsResult {
  events: MatchEventCreate[];
  side1Score: number;
  side2Score: number;
  duration: number;
  pauseDuration: number;
}

function pickGoalTypes(
  probabilities: [probability: number, uuid: string][],
): string[] {
  return probabilities.flatMap(([probability, uuid]) =>
    Math.random() < probability ? [uuid] : [],
  );
}

function generateMatchEvents(ctx: MatchEventContext): MatchEventsResult {
  let side1Score = 0;
  let side2Score = 0;

  let offset = 0;
  let pauseDuration = 0;

  const events: MatchEventCreate[] = [];

  while (
    (side1Score < 10 && side2Score < 10) ||
    side1Score === side2Score ||
    Math.abs(side1Score - side2Score) < 2
  ) {
    offset += nonLinearRandomInt(10000, 120000, 5);

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

          const goalTypes = pickGoalTypes(ctx.goalTypeProbabilities);

          if (scoringSide === MatchSideEnum.SIDE_1) {
            side1Score += 1;
            events.push({
              offset,
              type: 'GOAL',
              ownGoal: false,
              side: 'SIDE_1',
              goalType: goalTypes,
              player: pickRandom(ctx.playersSide1),
              labels: {},
            });
          } else {
            side2Score += 1;
            events.push({
              offset,
              type: 'GOAL',
              ownGoal: false,
              side: 'SIDE_2',
              goalType: goalTypes,
              player: pickRandom(ctx.playersSide2),
              labels: {},
            });
          }
        }
        break;

      case 'BALL_OUT':
        events.push({
          offset,
          type: 'BALL_OUT',
          labels: {},
        });
        break;

      case 'POSITION_CHANGE':
        events.push({
          offset,
          type: 'POSITION_CHANGE',
          side: pickRandom([MatchSideEnum.SIDE_1, MatchSideEnum.SIDE_2]),
          labels: {},
        });
        break;

      case 'EQUIPMENT_FAILURE':
        events.push({
          offset,
          type: 'EQUIPMENT_FAILURE',
          details:
            runWithProbability(0.7, () => faker.lorem.sentence()) ?? null,
          labels: {},
        });
        break;

      case 'PAUSE': {
        events.push({
          offset,
          type: 'PAUSE',
          details:
            runWithProbability(0.7, () => faker.lorem.sentence()) ?? null,
          countsAsPresence: false,
          labels: {},
        });

        const pause = nonLinearRandomInt(10000, 180000, 3);

        offset += pause;
        pauseDuration += pause;

        events.push({
          offset,
          type: 'RESUME',
          labels: {},
        });
        break;
      }

      default:
        break;
    }
  }

  return {
    events,
    side1Score,
    side2Score,
    duration: offset - pauseDuration,
    pauseDuration,
  };
}

export async function populateMatches(options: PopulateOptions): Promise<void> {
  if (options.clear) {
    logger.info('Clearing existing data from matches...', {
      label: ['cli', 'populate', 'matches'],
    });

    const deletedMatches = await db
      .delete(matchesTable)
      .where(eq(matchesTable.leagueUuid, options.leagueUuid))
      .returning();

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

  const availableGoalTypes = await GoalTypeModel.getAll(db, options.leagueUuid);
  const goalTypeProbabilities = availableGoalTypes.map(
    (goalType): [number, string] => [
      GoalTypeKeyProbabilities[goalType.key] ?? DEFAULT_GOAL_TYPE_PROBABILITY,
      goalType.uuid,
    ],
  );

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

      const benchUuids = playerUuids.filter((uuid) => !players.includes(uuid));
      const spectators = pickRandomMultiple(
        benchUuids,
        randomInt(0, Math.min(4, benchUuids.length) + 1),
      );

      const eventsResult = generateMatchEvents({
        playersSide1,
        playersSide2,
        goalTypeProbabilities,
      });

      await MatchModel.createFull(db, options.leagueUuid, {
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
        hidden: false,
        syncId: null,
        labels: {},
        events: eventsResult.events,
      });
    }),
  );

  logger.info('Finished populating matches', {
    label: ['cli', 'populate', 'matches'],
  });
}
