import { createMemo, Show } from 'solid-js';
import { Modal } from '#components/Modal';
import { Divider } from '#components/Widget';
import { useSheets } from '#providers/SheetsProvider';
import style from './PlayerProfileModal.module.scss';

export interface PlayerProfileModalProps {
  name: string;
}

export const PlayerProfileModal: Component<PlayerProfileModalProps> = (
  props,
) => {
  const [, { latest }] = useSheets();

  const playerStats = createMemo(
    () => latest().matchStats.playerStats[props.name],
  );

  return (
    <Modal class={style.modal} topLeftLabels="Player Profile">
      <Show
        when={playerStats()}
        fallback={
          <div class={style.notFound}>Player "{props.name}" not found.</div>
        }
      >
        <div class={style.container}>
          <span>Name:</span>
          <strong>{playerStats()?.player}</strong>
        </div>

        <Divider class={style.divider} />

        <div class={style.container}>
          <span>Total Matches:</span>
          <strong>{playerStats()?.totalMatches}</strong>

          <span>Total Playtime:</span>
          <strong>{playerStats()?.totalPlaytimeFormatted}</strong>

          <span>Average Match Duration:</span>
          <strong>{playerStats()?.averageMatchDurationFormatted}</strong>
        </div>

        <Divider class={style.divider} />

        <div class={style.container}>
          <span>Wins:</span>
          <strong>{playerStats()?.wins}</strong>

          <span>Losses:</span>
          <strong>{playerStats()?.losses}</strong>

          <span>Win Ratio:</span>
          <strong>{playerStats()?.winRatio.toFixed(2)}</strong>
        </div>

        <Divider class={style.divider} />

        <div class={style.container}>
          <span>Goals For:</span>
          <strong>{playerStats()?.goalsFor}</strong>

          <span>Goals Against:</span>
          <strong>{playerStats()?.goalsAgainst}</strong>

          <span>Goal Difference:</span>
          <strong>{playerStats()?.goalDifference}</strong>

          <span>Goal Ratio:</span>
          <strong>{playerStats()?.goalRatio.toFixed(2)}</strong>
        </div>
      </Show>
    </Modal>
  );
};
