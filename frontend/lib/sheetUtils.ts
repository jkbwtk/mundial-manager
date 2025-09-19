import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import type { Match } from '#shared/types/Sheets';
import { quickSwitch } from '#shared/utils';

dayjs.extend(duration);

export const DEFAULT_ELO = 1500;

export function formatDuration(seconds: number): string {
  if (seconds < 3600) {
    return dayjs.duration(seconds, 'seconds').format('mm:ss');
  }

  if (seconds < 86400) {
    return dayjs.duration(seconds, 'seconds').format('HH:mm:ss');
  }

  const durationObj = dayjs.duration(seconds, 'seconds');
  const hours = durationObj.asHours();

  return `${Math.floor(hours)}:${durationObj.format('mm:ss')}`;
}

export function formatDate(timestamp: number): string {
  return dayjs.unix(timestamp).format('YYYY-MM-DD');
}

export function getPlayersFromTeam(team: string): string[] {
  return team.split(/\s+/g).sort();
}

export function getPlayersFromMatch(match: Match): string[] {
  return [
    ...getPlayersFromTeam(match.team1),
    ...getPlayersFromTeam(match.team2),
  ];
}

function getKFactor(rating: number): number {
  if (rating < 2100) {
    return 32;
  }
  if (rating < 2400) {
    return 24;
  }
  return 16;
}

function getScoreMultiplier(scoreDiff: number): number {
  return quickSwitch<number>(scoreDiff, {
    0: 1.0,
    1: 1.0,
    2: 1.1,
    3: 1.2,
    4: 1.3,
    5: 1.4,
    6: 1.5,
    7: 1.6,
    8: 1.7,
    9: 1.8,
    10: 2.0,
    default: 1,
  });
}

export function calculateEloDiff(
  playerElo: number,
  opponentElo: number,
  playerScore: number,
  opponentScore: number,
): number {
  let playerFactor = getKFactor(playerElo);

  const expectedPlayer = 1.0 / (1.0 + 10 ** ((opponentElo - playerElo) / 400));

  let playerActual = 0;
  const scoreDiff = Math.abs(playerScore - opponentScore);

  if (playerScore > opponentScore) {
    playerActual = 1.0;
    playerFactor *= getScoreMultiplier(scoreDiff);
  } else if (playerScore === opponentScore) {
    playerActual = 0.5;
  }

  return playerFactor * (playerActual - expectedPlayer);
}

export function calculateElos(
  match: Match,
  previousElos: Record<string, number>,
  mode: 'player' | 'team' | 'team-individual' | 'hybrid',
): Record<string, number> {
  const elos = structuredClone(previousElos);

  if (mode === 'player') {
    if (getPlayersFromMatch(match).length !== 2) {
      return elos;
    }
  }

  if (mode === 'team' || mode === 'team-individual') {
    if (getPlayersFromMatch(match).length === 2) {
      return elos;
    }
  }

  const playersToCalculate =
    mode === 'hybrid' || mode === 'team-individual'
      ? getPlayersFromMatch(match)
      : [match.team1, match.team2];

  const getTeamElo = (team: string): number => {
    if (mode === 'hybrid') {
      const players = getPlayersFromTeam(team);

      return (
        players.reduce(
          (sum, player) => sum + (previousElos[player] ?? DEFAULT_ELO),
          0,
        ) / players.length
      );
    }

    return previousElos[team] ?? DEFAULT_ELO;
  };

  for (const player of playersToCalculate) {
    const playerTeam = match.team1.includes(player)
      ? {
          elo: getTeamElo(match.team1),
          score: match.score1,
        }
      : {
          elo: getTeamElo(match.team2),
          score: match.score2,
        };

    const opponentTeam = match.team1.includes(player)
      ? {
          elo: getTeamElo(match.team2),
          score: match.score2,
        }
      : {
          elo: getTeamElo(match.team1),
          score: match.score1,
        };

    const playerElo = previousElos[player] ?? DEFAULT_ELO;

    elos[player] =
      playerElo +
      calculateEloDiff(
        playerTeam.elo,
        opponentTeam.elo,
        playerTeam.score,
        opponentTeam.score,
      );
  }

  return elos;
}
