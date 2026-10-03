import { type Accessor, createMemo } from 'solid-js';
import { getTableSideColor } from '#flib/teamColors';
import { getMatchSidePlayers } from '#shared/matchTimeline';
import type { MatchSide } from '#shared/types/api/matchEvent';
import type { MatchTimeline } from '#shared/types/api/matchTimeline';
import { shortUUID } from '#shared/utils';

export interface MatchTimelineLookup {
  timeline: Accessor<MatchTimeline>;

  getPlayerName: (uuid: string) => string;
  getBallName: (uuid: string) => string;

  getSidePlayers: (side: MatchSide) => readonly string[];
  getSidePlayerNames: (side: MatchSide) => string[];
  getSideColor: (side: MatchSide) => string;
}

const EMPTY_REFERENCE_LABEL = '---';

function getReferenceName(names: Map<string, string>, uuid: string): string {
  return names.get(uuid) ?? (uuid ? shortUUID(uuid) : EMPTY_REFERENCE_LABEL);
}

export function createMatchTimelineLookup(
  timeline: Accessor<MatchTimeline>,
): MatchTimelineLookup {
  const playerNames = createMemo(
    () =>
      new Map(timeline().players.map((player) => [player.uuid, player.name])),
  );

  const ballNames = createMemo(
    () => new Map(timeline().balls.map((ball) => [ball.uuid, ball.name])),
  );

  const getPlayerName = (uuid: string) => getReferenceName(playerNames(), uuid);

  const getBallName = (uuid: string) => getReferenceName(ballNames(), uuid);

  const getSidePlayers = (side: MatchSide) =>
    getMatchSidePlayers(timeline().match, side);

  const getSidePlayerNames = (side: MatchSide) =>
    getSidePlayers(side).map(getPlayerName).sort();

  const getSideColor = (side: MatchSide) =>
    getTableSideColor(timeline().table, side);

  return {
    timeline,

    getPlayerName,
    getBallName,

    getSidePlayers,
    getSidePlayerNames,
    getSideColor,
  };
}
