import { eq } from 'drizzle-orm';
import z from 'zod';
import type { TX } from '#backend/db/database';
import { GoalTypeModel } from '#backend/db/models/GoalTypeModel';
import { matchTimelinesTable } from '#backend/db/schema';
import { MatchEvent } from '#shared/types/api/matchEvent';
import type { UpgradeOptions } from '#tools/commands/upgrade';
import {
  getUpgradeLeagueFilter,
  isUpgradeRecord,
  type UpgradeResult,
  upgradeRows,
} from '#tools/commands/upgrade/utils';

function upgradeGoalType(value: unknown, keys: Map<string, string>): unknown {
  if (z.uuid().safeParse(value).success) return value;

  const uuid = typeof value === 'string' ? keys.get(value) : undefined;

  if (uuid === undefined) {
    throw new Error(`Unknown goal type ${JSON.stringify(value)}`);
  }

  return uuid;
}

function upgradeMatchEvent(event: unknown, keys: Map<string, string>): unknown {
  if (!isUpgradeRecord(event) || event.type !== 'GOAL') return event;
  if (!Array.isArray(event.goalType)) return event;

  return {
    ...event,
    goalType: event.goalType.map((value) => upgradeGoalType(value, keys)),
  };
}

export async function upgradeTimelines(
  tx: TX,
  options: UpgradeOptions,
): Promise<UpgradeResult> {
  const timelines = await tx.query.matchTimelinesTable.findMany({
    where: { ...getUpgradeLeagueFilter(options), $deletedAt: { isNull: true } },
  });
  const goalTypeKeys = new Map<string, Map<string, string>>();

  for (const leagueUuid of new Set(timelines.map((t) => t.leagueUuid))) {
    const goalTypes = await GoalTypeModel.getAll(tx, leagueUuid);

    goalTypeKeys.set(
      leagueUuid,
      new Map(goalTypes.map((goalType) => [goalType.key, goalType.uuid])),
    );
  }

  return upgradeRows({
    name: 'timelines',
    label: ['cli', 'upgrade', 'timelines'],
    rows: timelines,
    getStored: (timeline) => timeline.events,
    upgrade: (timeline) => {
      const keys = goalTypeKeys.get(timeline.leagueUuid) ?? new Map();
      const events: unknown[] = timeline.events;

      return MatchEvent.array().parse(
        events.map((event) => upgradeMatchEvent(event, keys)),
      );
    },
    save: (timeline, events) =>
      tx
        .update(matchTimelinesTable)
        .set({ events })
        .where(eq(matchTimelinesTable.uuid, timeline.uuid)),
  });
}
