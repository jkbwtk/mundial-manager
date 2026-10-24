import { db } from '#backend/db/database';
import { ActiveMatchModel } from '#backend/db/models/ActiveMatchModel';
import { afterCommit } from '#blib/afterCommit';

export function queueActiveMatchesPublish(leagueUuid: string): void {
  afterCommit<null>(
    `activeMatches:${leagueUuid}`,
    () => null,
    () => ActiveMatchModel.publish(db, leagueUuid),
  );
}
