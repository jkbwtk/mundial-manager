import { eq } from 'drizzle-orm';
import type { TX } from '#backend/db/database';
import { leaguesTable } from '#backend/db/schema';
import type { UpgradeOptions } from '#tools/commands/upgrade';
import { upgradeSeasonConfig } from '#tools/commands/upgrade/seasons';
import {
  isUpgradeRecord,
  type UpgradeResult,
  upgradeRows,
} from '#tools/commands/upgrade/utils';

function isEmptyConfig(config: unknown): boolean {
  return !isUpgradeRecord(config) || Object.keys(config).length === 0;
}

export async function upgradeLeagues(
  tx: TX,
  options: UpgradeOptions,
): Promise<UpgradeResult> {
  const leagues = await tx.query.leaguesTable.findMany({
    where: {
      ...(options.leagueUuid === null ? {} : { uuid: options.leagueUuid }),
      $deletedAt: { isNull: true },
    },
  });
  const latestConfigs = new Map<string, unknown>();

  for (const league of leagues) {
    const latest = await tx.query.seasonsTable.findFirst({
      where: { leagueUuid: league.uuid, $deletedAt: { isNull: true } },
      orderBy: { startDate: 'desc' },
    });

    if (latest !== undefined) latestConfigs.set(league.uuid, latest.config);
  }

  return upgradeRows({
    name: 'leagues',
    label: ['cli', 'upgrade', 'leagues'],
    rows: leagues,
    getStored: (league) => league.seasonConfig,
    upgrade: (league) => {
      if (!isEmptyConfig(league.seasonConfig)) {
        return upgradeSeasonConfig(league.seasonConfig);
      }

      return {
        ...upgradeSeasonConfig(latestConfigs.get(league.uuid) ?? {}),
        goalTypes: {},
      };
    },
    save: (league, seasonConfig) =>
      tx
        .update(leaguesTable)
        .set({ seasonConfig })
        .where(eq(leaguesTable.uuid, league.uuid)),
  });
}
