import dayjs from 'dayjs';
import { WebhookClient, type WebhookMessageCreateOptions } from 'discord.js';
import { environment } from '#backend/environment';
import { logger } from '#shared/logger';
import {
  getBallOutEvents,
  getOwnGoalEvents,
  getPauseDuration,
  getPositionChangeEvents,
  getTeamColors,
  hasWon,
} from '#shared/matchUtils';
import { formatDuration } from '#shared/timeUtils';
import type { Match } from '#shared/types/Sheets';
import { type QuickSwitchCases, quickSwitch } from '#shared/utils';

const teamColorMap: QuickSwitchCases<number, string> = {
  czerwony2: 0xa62130,
  czerwony3: 0xdf2137,
  zielony: 0x16ad82,
  niebieski: 0x136fac,
  default: 0x767676,
};

const teamColorEmojiMap: QuickSwitchCases<string, string> = {
  czerwony2: ':red_square:',
  czerwony3: ':red_square:',
  zielony: ':green_square:',
  niebieski: ':blue_square:',
  default: ':white_large_square:',
};

async function _sendMatchSummaryWebhook(match: Match) {
  const webhookId = environment.DISCORD_WEBHOOK_ID;
  const webhookToken = environment.DISCORD_WEBHOOK_TOKEN;

  if (!webhookId || !webhookToken) {
    return;
  }

  const webhookClient = new WebhookClient({
    id: webhookId,
    token: webhookToken,
  });

  const color = quickSwitch(
    match.winningColor.toLocaleLowerCase(),
    teamColorMap,
  );

  const team1 = hasWon(match, 'team1') ? `__${match.team1}__` : match.team1;
  const team2 = hasWon(match, 'team2') ? `__${match.team2}__` : match.team2;

  const [team1Color, team2Color] = getTeamColors(match);

  const team1Emoji = quickSwitch(
    team1Color.toLocaleLowerCase(),
    teamColorEmojiMap,
  );
  const team2Emoji = quickSwitch(
    team2Color.toLocaleLowerCase(),
    teamColorEmojiMap,
  );

  const options: WebhookMessageCreateOptions = {
    embeds: [
      {
        title: 'Match Summary',
        color,
        timestamp: match.replayMetadata
          ? dayjs.unix(match.replayMetadata?.startedAt).toISOString()
          : undefined,
        description: `${team1Emoji} ${team1} **${match.score1}** - **${match.score2}** ${team2} ${team2Emoji}

:hourglass: Duration: **${formatDuration(match.duration)}**
:pause_button: Pause Duration: **${formatDuration(getPauseDuration(match.replayMetadata?.events ?? []))}**,
:elevator: Floor: **${match.floor ?? 'N/A'}**

Ball outs: **${getBallOutEvents(match)?.length ?? 0}**
Position changes: **${getPositionChangeEvents(match)?.length ?? 0}**
Own goals: **${getOwnGoalEvents(match)?.length ?? 0}**
`,
        footer: {
          text: `ID: #${match.id}, hash: ${match.hash.substring(0, 8)}`,
          icon_url: environment.MANAGER_ICON_URL ?? undefined,
          proxy_icon_url: environment.MANAGER_ICON_URL ?? undefined,
        },
      },
    ],
  };

  return webhookClient.send(options);
}

export function sendMatchSummaryWebhook(match: Match) {
  return _sendMatchSummaryWebhook(match).catch((err) => {
    logger.error('Failed to send match summary webhook', {
      label: ['webhookUtils', 'sendMatchSummaryWebhook'],
      error: err,
    });
  });
}
