import { eq } from 'drizzle-orm';
import type { TX } from '#backend/db/database';
import { GoalTypeModel } from '#backend/db/models/GoalTypeModel';
import { seasonsTable } from '#backend/db/schema';
import { defaultSkillParams } from '#shared/defaults/ratingSystem';
import { defaultSeasonConfig } from '#shared/defaults/season';
import { getSeasonGoalTypes } from '#shared/goalTypes';
import type { GoalType } from '#shared/types/api/goalType';
import { SeasonConfig } from '#shared/types/api/season';
import type { LegacySeasonConfig } from '#shared/types/Sheets';
import { withDefaults } from '#shared/zod';
import { convertLegacySeasonConfig } from '#tools/commands/import/seasons';
import type { UpgradeOptions } from '#tools/commands/upgrade';
import {
  getUpgradeLeagueFilter,
  isUpgradeRecord,
  type UpgradeResult,
  upgradeRows,
} from '#tools/commands/upgrade/utils';

export function upgradeSeasonConfig(config: unknown): SeasonConfig {
  if (isUpgradeRecord(config) && 'defaultEloRating' in config) {
    return convertLegacySeasonConfig(config as unknown as LegacySeasonConfig);
  }

  const current = isUpgradeRecord(config) ? config : {};
  const ratings = isUpgradeRecord(current.ratings) ? current.ratings : {};
  const skill = isUpgradeRecord(ratings.SKILL) ? ratings.SKILL : {};

  return withDefaults(SeasonConfig, defaultSeasonConfig).parse({
    ...current,
    ratings: { ...ratings, SKILL: { ...defaultSkillParams, ...skill } },
  });
}

export async function upgradeSeasons(
  tx: TX,
  options: UpgradeOptions,
): Promise<UpgradeResult> {
  const seasons = await tx.query.seasonsTable.findMany({
    where: { ...getUpgradeLeagueFilter(options), $deletedAt: { isNull: true } },
  });
  const goalTypes = new Map<string, GoalType[]>();

  for (const leagueUuid of new Set(seasons.map((s) => s.leagueUuid))) {
    goalTypes.set(leagueUuid, await GoalTypeModel.getAll(tx, leagueUuid));
  }

  return upgradeRows({
    name: 'seasons',
    label: ['cli', 'upgrade', 'seasons'],
    rows: seasons,
    getStored: (season) => season.config,
    upgrade: (season) => {
      const config = upgradeSeasonConfig(season.config);

      return {
        ...config,
        goalTypes: getSeasonGoalTypes(
          goalTypes.get(season.leagueUuid) ?? [],
          config.goalTypes,
        ),
      };
    },
    save: (season, config) =>
      tx
        .update(seasonsTable)
        .set({ config })
        .where(eq(seasonsTable.uuid, season.uuid)),
  });
}
