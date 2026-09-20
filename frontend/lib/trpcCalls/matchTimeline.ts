import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import {
  MatchTimeline,
  type MatchTimelineSave,
} from '#shared/types/api/matchTimeline';

export const queryMatchTimeline = query(async (matchUuid: string) => {
  const timeline = await trpcClient.matchTimelines.getByMatchId.query({
    matchUuid,
  });

  return MatchTimeline.parse(timeline);
}, 'queryMatchTimeline');

export const actionSaveMatchTimeline = action(
  async (timeline: MatchTimelineSave) => {
    const savedTimeline =
      await trpcClient.matchTimelines.saveByMatchId.mutate(timeline);

    return json(MatchTimeline.parse(savedTimeline), {
      revalidate: [
        'queryMatchTimeline',
        'queryMatches',
        'queryMatchById',
        'queryLegacyMatches',
      ],
    });
  },
  'actionSaveMatchTimeline',
);
