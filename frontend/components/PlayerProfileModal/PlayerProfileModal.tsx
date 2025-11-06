import { createMemo, createSignal, Show } from 'solid-js';
import { Button } from '#components/Button';
import { DeltaDisplay } from '#components/DeltaDisplay';
import { Modal } from '#components/Modal';
import { PlayerPickerModal } from '#components/PlayerPickerModal';
import { Divider } from '#components/Widget';
import { formatDuration } from '#flib/sheetUtils';
import { useModal } from '#providers/ModalProvider';
import { useSheets } from '#providers/SheetsProvider';
import style from './PlayerProfileModal.module.scss';

export interface PlayerProfileModalProps {
  name: string;
}

export const PlayerProfileModal: Component<PlayerProfileModalProps> = (
  props,
) => {
  const [, { open }] = useModal();
  const [, { latest }] = useSheets();

  const [comparedPlayer, setComparedPlayer] = createSignal<string | undefined>(
    undefined,
  );

  const playerStats = createMemo(
    () => latest().matchStats.playerStats[props.name],
  );

  const comparedPlayerStats = createMemo(() => {
    const player = comparedPlayer();
    if (!player) return undefined;
    return latest().matchStats.playerStats[player];
  });

  const handlePickerClose = (selectedPlayer?: unknown) => {
    if (selectedPlayer) {
      setComparedPlayer(selectedPlayer as string);
    }
  };

  const clearComparison = () => {
    setComparedPlayer(undefined);
  };

  const openPlayerPicker = () => {
    open(
      {
        component: PlayerPickerModal,
        disabledPlayers: [props.name],
      },
      handlePickerClose,
    );
  };

  return (
    <Modal
      class={style.modal}
      topLeftLabels="Player Profile"
      bottomRightLabels={[
        <Show when={comparedPlayer()}>
          <Button severity="secondary" onPointerUp={clearComparison}>
            Clear
          </Button>
        </Show>,
        <Button severity="secondary" onPointerUp={openPlayerPicker}>
          Compare
        </Button>,
      ]}
    >
      <Show
        when={playerStats()}
        fallback={
          <div class={style.notFound}>Player "{props.name}" not found.</div>
        }
      >
        <div class={style.container}>
          <span>Player{comparedPlayer() ? 's' : ''}:</span>
          <strong>
            {playerStats()?.player}

            <Show when={comparedPlayer()}>
              <span> vs </span>
              <strong>{comparedPlayer()}</strong>
            </Show>
          </strong>
        </div>

        <Divider class={style.divider} />

        <div class={style.container}>
          <span>Total playtime:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.totalPlaytime}
              compared={comparedPlayerStats()?.totalPlaytime}
              displayBase={true}
              displayCompared={true}
              formatter={(v) => formatDuration(v ?? 0)}
            />
          </strong>

          <span>Avg. match duration:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.averageMatchDuration}
              compared={comparedPlayerStats()?.averageMatchDuration}
              displayBase={true}
              displayCompared={true}
              formatter={(v) => formatDuration(v ?? 0)}
            />
          </strong>
        </div>

        <Divider class={style.divider} />

        <div class={style.container}>
          <span>Total Matches:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.totalMatches}
              compared={comparedPlayerStats()?.totalMatches}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Wins:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.wins}
              compared={comparedPlayerStats()?.wins}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Losses:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.losses}
              compared={comparedPlayerStats()?.losses}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Win Ratio:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.winRatio}
              compared={comparedPlayerStats()?.winRatio}
              displayBase={true}
              displayCompared={true}
            />
          </strong>
        </div>

        <Divider class={style.divider} />

        <div class={style.container}>
          <span>Goals For:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.goalsFor}
              compared={comparedPlayerStats()?.goalsFor}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Goals Against:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.goalsAgainst}
              compared={comparedPlayerStats()?.goalsAgainst}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Goal Difference:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.goalDifference}
              compared={comparedPlayerStats()?.goalDifference}
              displayBase={true}
              displayCompared={true}
            />
          </strong>

          <span>Goal Ratio:</span>
          <strong>
            <DeltaDisplay
              base={playerStats()?.goalRatio}
              compared={comparedPlayerStats()?.goalRatio}
              displayBase={true}
              displayCompared={true}
            />
          </strong>
        </div>
      </Show>
    </Modal>
  );
};
