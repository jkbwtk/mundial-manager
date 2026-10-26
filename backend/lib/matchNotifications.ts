import { db } from '#backend/db/database';
import { LeagueModel } from '#backend/db/models/LeagueModel';
import { PlayerModel } from '#backend/db/models/PlayerModel';
import { TableModel } from '#backend/db/models/TableModel';
import { environment } from '#backend/environment';
import type { MatchSelectSchema } from '#backend/types/db/match';
import { afterCommit } from '#blib/afterCommit';
import {
  PushNotificationTTLs,
  sendLeaguePushNotification,
} from '#blib/pushNotifications';
import {
  formatExactStartTime,
  formatKnownStartDate,
  getKnownStartDate,
  hasExactStartDate,
} from '#shared/matchLabels';
import { getMatchPlayerUuids } from '#shared/matchPlayers';
import { PushNotificationTypeLabels } from '#shared/pushNotification';
import {
  DecidedMatchStatuses,
  EndedMatchStatuses,
  type MatchStatus,
  MatchStatusEnum,
} from '#shared/types/api/match';
import {
  type PushNotification,
  type PushNotificationType,
  PushNotificationTypeEnum,
} from '#shared/types/api/pushNotification';

interface MatchStatusChange {
  from: MatchStatus | null;
  match: MatchSelectSchema;
}

function getMatchNotificationType(
  from: MatchStatus | null,
  to: MatchStatus,
): PushNotificationType | null {
  if (from === to) return null;

  if (to === MatchStatusEnum.SCHEDULED && from === null) {
    return PushNotificationTypeEnum.MATCH_SCHEDULED;
  }

  if (
    to === MatchStatusEnum.ONGOING &&
    (from === null || from === MatchStatusEnum.SCHEDULED)
  ) {
    return PushNotificationTypeEnum.MATCH_STARTED;
  }

  if (
    DecidedMatchStatuses.includes(to) &&
    (from === null || !EndedMatchStatuses.includes(from))
  ) {
    return PushNotificationTypeEnum.MATCH_FINISHED;
  }

  return null;
}

function isMatchNotificationStale(
  type: PushNotificationType,
  match: MatchSelectSchema,
): boolean {
  const startDate = getKnownStartDate(match);

  if (type === PushNotificationTypeEnum.MATCH_SCHEDULED || startDate === null) {
    return false;
  }

  const happenedAt =
    type === PushNotificationTypeEnum.MATCH_STARTED
      ? startDate.getTime()
      : startDate.getTime() + (match.duration ?? 0) + match.pauseDuration;

  return Date.now() - happenedAt > PushNotificationTTLs[type];
}

async function createMatchNotification(
  leagueUuid: string,
  type: PushNotificationType,
  match: MatchSelectSchema,
): Promise<PushNotification> {
  const [players, table, league] = await Promise.all([
    PlayerModel.getByIds(db, leagueUuid, getMatchPlayerUuids(match)),
    match.tableUuid
      ? TableModel.getById(db, leagueUuid, match.tableUuid)
      : null,
    LeagueModel.getById(db, leagueUuid),
  ]);

  const getSideLabel = (uuids: string[]) =>
    uuids
      .map((uuid) => players.find((player) => player.uuid === uuid)?.name)
      .filter((name) => name !== undefined)
      .join(' & ');

  const side1 = getSideLabel(match.playersSide1);
  const side2 = getSideLabel(match.playersSide2);
  const timeZone = league?.instance.timezone;
  const startDate = hasExactStartDate(match)
    ? `${formatKnownStartDate(match, timeZone)} ${formatExactStartTime(match, timeZone)}`
    : formatKnownStartDate(match, timeZone);

  const body = {
    MATCH_SCHEDULED: `${side1} vs ${side2}\n${startDate}`,
    MATCH_STARTED: `${side1} vs ${side2}`,
    MATCH_FINISHED: `${side1} ${match.side1Score}:${match.side2Score} ${side2}`,
  } satisfies Record<PushNotificationType, string>;

  return {
    title: PushNotificationTypeLabels[type],
    body: table ? `${body[type]}\n${table.name}` : body[type],
    tag: `match-${match.uuid}`,
    navigate: new URL('/', environment.BASE_SITE_URL).toString(),
  };
}

export function queueMatchNotification(
  leagueUuid: string,
  previous: MatchSelectSchema | null,
  match: MatchSelectSchema,
): void {
  afterCommit<MatchStatusChange>(
    `matchNotification:${match.uuid}`,
    (current) => ({
      from: current === null ? (previous?.status ?? null) : current.from,
      match,
    }),
    async (change) => {
      const type = getMatchNotificationType(change.from, change.match.status);

      if (type === null || isMatchNotificationStale(type, change.match)) {
        return;
      }

      await sendLeaguePushNotification(
        db,
        leagueUuid,
        type,
        () => createMatchNotification(leagueUuid, type, change.match),
        change.match.uuid.replaceAll('-', ''),
      );
    },
  );
}
