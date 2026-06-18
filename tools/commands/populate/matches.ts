import { randomInt } from 'node:crypto';
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
} from '#shared/random';
import type { MatchEventCreate } from '#shared/types/api/matchEvent';
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
  const events: MatchEventCreate[] = [];

  let side1Score = 0;
  let side2Score = 0;

  let currentTime = ctx.startDate.getTime();

  while (
    (side1Score < 10 && side2Score < 10) ||
    side1Score === side2Score ||
    Math.abs(side1Score - side2Score) < 2
  ) {
    currentTime += nonLinearRandomInt(5000, 180000);
    const scoringSide = pickRandom([
      MatchSideEnum.SIDE_1,
      MatchSideEnum.SIDE_2,
    ]);

    if (scoringSide === MatchSideEnum.SIDE_1) {
      side1Score += 1;
      events.push({
        time: new Date(currentTime),
        type: 'GOAL',
        matchUuid: '',
        ownGoal: false,
        goalType: [],
        player: pickRandom(ctx.playersSide1),
      });
    } else {
      side2Score += 1;
      events.push({
        time: new Date(currentTime),
        type: 'GOAL',
        matchUuid: '',
        ownGoal: false,
        goalType: [],
        player: pickRandom(ctx.playersSide2),
      });
    }
  }

  const duration = currentTime - ctx.startDate.getTime();

  return {
    events,
    side1Score,
    side2Score,
    duration,
    pauseDuration: 0,
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
        events: [],
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
