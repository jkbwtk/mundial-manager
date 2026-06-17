import { randomInt } from 'node:crypto';
import { db } from '#backend/db/database';
import { BallModel } from '#backend/db/models/BallModel';
import { MatchModel } from '#backend/db/models/MatchModel';
import { PlayerModel } from '#backend/db/models/PlayerModel';
import { TableModel } from '#backend/db/models/TableModel';
import { matchesTable } from '#backend/db/schema';
import { logger } from '#shared/logger';
import {
  pickRandom,
  pickRandomMultiple,
  runWithProbability,
} from '#shared/random';
import { MatchSideEnum } from '#shared/types/api/match';
import { range } from '#shared/utils';
import type { PopulateOptions } from '#tools/commands/populate';

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
    range(options.count).map(() => {
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

      const winnerSide = pickRandom([
        MatchSideEnum.SIDE_1,
        MatchSideEnum.SIDE_2,
      ]);

      let side1Score = winnerSide === 'SIDE_1' ? 10 : randomInt(0, 11);
      let side2Score = winnerSide === 'SIDE_2' ? 10 : randomInt(0, 11);

      while (
        side1Score === side2Score ||
        Math.abs(side1Score - side2Score) < 2
      ) {
        side1Score += randomInt(0, 2);
        side2Score += randomInt(0, 2);
      }

      const duration = randomInt(240, 600);
      const pauseDuration = runWithProbability(
        0.2,
        () => randomInt(10, 120),
        () => 0,
      );

      const spectators = pickRandomMultiple(
        playerUuids,
        randomInt(0, Math.min(4, playerUuids.length - 2) + 1),
      );

      return MatchModel.create(db, options.leagueUuid, {
        tableUuid,
        ballUuid,
        startDate,
        duration,
        pauseDuration,
        side1Score,
        side2Score,
        playersSide1,
        playersSide2,
        spectators,
        status: 'FINISHED',
        events: [],
      });
    }),
  );

  logger.info('Finished populating matches', {
    label: ['cli', 'populate', 'matches'],
  });
}
