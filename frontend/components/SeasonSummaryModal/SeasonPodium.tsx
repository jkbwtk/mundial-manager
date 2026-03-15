import { For, mergeProps, Show } from 'solid-js';
import { Identicon } from '#components/Identicon';
import { useStatPaginatedFrame } from '#components/StatPaginatorWidget';
import { Divider } from '#components/Widget';
import type { RequiredDefaults } from '#shared/utils';
import style from './SeasonSummaryModal.module.scss';

export interface Result {
  team: string;
  rating: number;
}

export type SeasonPodiumProps = {
  showAll?: boolean;
};

function getPosition(place: number): string {
  switch (place) {
    case 1:
      return '1st';
    case 2:
      return '2nd';
    case 3:
      return '3rd';

    default:
      return `${place}th`;
  }
}

const defaultProps: RequiredDefaults<SeasonPodiumProps> = {
  showAll: false,
};

export const SeasonPodium: Component<SeasonPodiumProps> = (userProps) => {
  const frame = useStatPaginatedFrame();
  const props = mergeProps(defaultProps, userProps);

  const results = () =>
    Object.entries(frame().eloRatings.hybridElos)
      .sort(([, a], [, b]) => b.rating - a.rating)
      .map(([team, rating]) => ({ team, rating: rating.rating }))
      .slice(0, props.showAll ? undefined : 3);

  return (
    <div class={style.podiumContainer}>
      <For each={results()}>
        {(result, index) => (
          <>
            <Show when={index() === 3}>
              <Divider class={style.divider} />
            </Show>

            <div
              classList={{
                [style.podium]: true,

                // @ts-expect-error
                [style[`place${index() + 1}`]]: true,
              }}
            >
              <Identicon class={style.icon} value={result.team} size={3} />

              <span class={style.teamName}>{result.team}</span>

              <div class={style.step}>
                <div class={style.position}>{getPosition(index() + 1)}</div>
              </div>

              <span class={style.rating}>{result.rating.toFixed(1)}</span>
            </div>
          </>
        )}
      </For>
    </div>
  );
};
