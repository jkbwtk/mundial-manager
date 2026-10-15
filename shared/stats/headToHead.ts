import { defaultHeadToHeadRecord } from '#shared/defaults/headToHead';
import { getMatchSidePlayers, getMatchSideScores } from '#shared/matchTimeline';
import type {
  HeadToHead,
  HeadToHeadRecord,
} from '#shared/types/api/headToHead';
import type { Match } from '#shared/types/api/match';
import { MatchSides } from '#shared/types/api/matchEvent';

type HeadToHeadMatch = Pick<
  Match,
  'playersSide1' | 'playersSide2' | 'side1Score' | 'side2Score'
>;

type HeadToHeadOutcome = keyof HeadToHeadRecord;

function getHeadToHeadOutcome(
  score: number,
  opponentScore: number,
): HeadToHeadOutcome {
  if (score === opponentScore) return 'draws';

  return score > opponentScore ? 'wins' : 'losses';
}

function addHeadToHeadOutcome<Record extends HeadToHeadRecord>(
  record: Record,
  outcome: HeadToHeadOutcome,
): Record {
  return { ...record, [outcome]: record[outcome] + 1 };
}

export function calculateHeadToHead(
  matches: HeadToHeadMatch[],
  playerUuid: string,
): HeadToHead[] {
  const records = new Map<string, HeadToHead>();

  for (const match of matches) {
    const side = MatchSides.find((side) =>
      getMatchSidePlayers(match, side).includes(playerUuid),
    );

    if (side === undefined) continue;

    const opponentSide = side === 'SIDE_1' ? 'SIDE_2' : 'SIDE_1';
    const opponents = getMatchSidePlayers(match, opponentSide);
    const [score, opponentScore] = getMatchSideScores(match, side);
    const outcome = getHeadToHeadOutcome(score, opponentScore);
    const isSingles =
      match.playersSide1.length === 1 && match.playersSide2.length === 1;

    for (const opponentUuid of opponents) {
      const record = records.get(opponentUuid) ?? {
        opponentUuid,
        ...defaultHeadToHeadRecord,
        singles: defaultHeadToHeadRecord,
        doubles: defaultHeadToHeadRecord,
      };

      records.set(opponentUuid, {
        ...addHeadToHeadOutcome(record, outcome),
        singles: isSingles
          ? addHeadToHeadOutcome(record.singles, outcome)
          : record.singles,
        doubles: isSingles
          ? record.doubles
          : addHeadToHeadOutcome(record.doubles, outcome),
      });
    }
  }

  return [...records.values()];
}
