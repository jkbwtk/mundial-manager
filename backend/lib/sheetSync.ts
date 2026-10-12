import { convertToLegacyMatch } from '#backend/adapters/matchAdapter';
import type { DB } from '#backend/db/database';
import { MatchModel } from '#backend/db/models/MatchModel';
import { SheetStore } from '#backend/SheetStore';
import { logger } from '#shared/logger';
import {
  Match as LegacyMatch,
  type MatchCreate as LegacyMatchCreate,
} from '#shared/types/Sheets';

let sheetStoreSingleton: Promise<SheetStore> | null = null;

function getSheetStore(): Promise<SheetStore> {
  if (sheetStoreSingleton === null) {
    const store = new SheetStore();

    sheetStoreSingleton = store.initialize().then(() => store);
    sheetStoreSingleton.catch(() => {
      sheetStoreSingleton = null;
    });
  }

  return sheetStoreSingleton;
}

async function writeMatchToSheet(match: LegacyMatchCreate): Promise<void> {
  const store = await getSheetStore();

  await store.createMatch(match);
}

export function saveLegacyMatchToSheet(match: LegacyMatchCreate): void {
  writeMatchToSheet(match).catch((err) => {
    logger.error('Failed to save match to Google Sheets', {
      label: ['sheetSync', 'saveLegacyMatchToSheet'],
      error: err,
    });
  });
}

async function convertMatchForSheet(
  db: DB,
  leagueUuid: string,
  matchUuid: string,
): Promise<LegacyMatchCreate> {
  const timeline = await MatchModel.getTimeline(db, leagueUuid, matchUuid);

  const legacyMatch = convertToLegacyMatch(
    { ...timeline.match, table: timeline.table, events: timeline.events },
    Object.fromEntries(timeline.players.map((player) => [player.uuid, player])),
    Object.fromEntries(
      timeline.goalTypes.map((goalType) => [goalType.uuid, goalType]),
    ),
  );

  return LegacyMatch.parse(legacyMatch);
}

export function saveMatchToSheet(
  db: DB,
  leagueUuid: string,
  matchUuid: string,
): void {
  convertMatchForSheet(db, leagueUuid, matchUuid)
    .then(writeMatchToSheet)
    .catch((err) => {
      logger.error('Failed to save match %s to Google Sheets', matchUuid, {
        label: ['sheetSync', 'saveMatchToSheet'],
        error: err,
      });
    });
}
