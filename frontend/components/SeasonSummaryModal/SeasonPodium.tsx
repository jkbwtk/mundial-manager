import { For, Show } from 'solid-js';
import { Identicon } from '#components/Identicon';
import { Divider } from '#components/Widget';
import style from './SeasonSummaryModal.module.scss';
import type { SeasonSummaryData } from './seasonSummaryData';

export interface SeasonPodiumProps {
  data: SeasonSummaryData;
}

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

const PODIUM_PLACES = 3;

export const SeasonPodium: Component<SeasonPodiumProps> = (props) => {
  const results = () => props.data.standings().slice(0, PODIUM_PLACES);

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
              <Identicon
                class={style.icon}
                value={result.playerUuid}
                size={3}
              />

              <span class={style.teamName}>
                {props.data.players.getLabel(result.playerUuid)}
              </span>

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
