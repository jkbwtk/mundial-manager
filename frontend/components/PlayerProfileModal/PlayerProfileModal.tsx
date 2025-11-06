import {
  createMemo,
  createSignal,
  createUniqueId,
  For,
  Match,
  Show,
  Switch,
} from 'solid-js';
import { Break } from '#components/Break';
import { Button } from '#components/Button';
import { Input } from '#components/Input';
import { Modal } from '#components/Modal';
import { Divider } from '#components/Widget';
import { useModal, useModalActions } from '#providers/ModalProvider';
import { useSheets } from '#providers/SheetsProvider';
import style from './PlayerProfileModal.module.scss';

export interface PlayerProfileModalProps {
  name: string;
}

export interface PlayerPickerProps {
  disabledPlayer?: string;
}

const PlayerPicker: Component<PlayerPickerProps> = (props) => {
  const [, { latest }] = useSheets();
  const { closeModal } = useModalActions();

  const formId = createUniqueId();

  const handleSubmit = (ev: SubmitEvent) => {
    ev.preventDefault();

    if (ev.target instanceof HTMLFormElement) {
      const formData = new FormData(ev.target as HTMLFormElement);

      closeModal(formData.get('player'));
    }
  };

  return (
    <Modal
      class={style.pickerModal}
      topLeftLabels="Player Picker"
      bottomRightLabels={[
        <Button severity="secondary" type="submit" form={formId}>
          Select
        </Button>,
      ]}
    >
      <form id={formId} class={style.pickerForm} onSubmit={handleSubmit}>
        <For each={latest().matchStats.generalStats.uniquePlayers}>
          {(player) => (
            <div>
              <Input
                id={player}
                type="radio"
                name="player"
                value={player}
                disabled={player === props.disabledPlayer}
                required
              >
                {player}
              </Input>
            </div>
          )}
        </For>
        <Break />
      </form>
    </Modal>
  );
};

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

  const getDifference = (
    mainValue: number,
    comparedValue: number | undefined,
  ) => {
    if (comparedValue === undefined) return undefined;
    return mainValue - comparedValue;
  };

  const renderStatWithDifference = (
    value: number | string,
    comparedValue: number | undefined,
    precision = 0,
  ) => {
    if (comparedPlayerStats() === undefined) {
      return typeof value === 'number' && precision > 0
        ? value.toFixed(precision)
        : value;
    }

    const numValue =
      typeof value === 'number' ? value : Number.parseFloat(value as string);
    const diff = getDifference(numValue, comparedValue);

    if (diff === undefined) {
      return typeof value === 'number' && precision > 0
        ? value.toFixed(precision)
        : value;
    }

    return (
      <>
        {typeof value === 'number' && precision > 0
          ? value.toFixed(precision)
          : value}
        <span
          classList={{
            [style.delta]: true,
            [style.positive]: diff > 0,
            [style.negative]: diff < 0,
          }}
        >
          <span class={style.deltaSymbol}>
            <Switch>
              <Match when={diff === 0}>=</Match>
              <Match when={diff > 0}>↑</Match>
              <Match when={diff < 0}>↓</Match>
            </Switch>
          </span>
          {Math.abs(diff).toFixed(precision)}
        </span>
      </>
    );
  };

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
        component: PlayerPicker,
        disabledPlayer: props.name,
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
          <span>Name:</span>
          <strong>{playerStats()?.player}</strong>
        </div>

        <Show when={comparedPlayer()}>
          <div class={style.container}>
            <span>vs:</span>
            <strong>{comparedPlayer()}</strong>
          </div>
        </Show>

        <Divider class={style.divider} />

        <div class={style.container}>
          <span>Total Matches:</span>
          <strong>
            {renderStatWithDifference(
              playerStats()!.totalMatches,
              comparedPlayerStats()?.totalMatches,
            )}
          </strong>

          <span>Wins:</span>
          <strong>
            {renderStatWithDifference(
              playerStats()!.wins,
              comparedPlayerStats()?.wins,
            )}
          </strong>

          <span>Losses:</span>
          <strong>
            {renderStatWithDifference(
              playerStats()!.losses,
              comparedPlayerStats()?.losses,
            )}
          </strong>

          <span>Win Ratio:</span>
          <strong>
            {renderStatWithDifference(
              playerStats()!.winRatio,
              comparedPlayerStats()?.winRatio,
              2,
            )}
          </strong>
        </div>

        <Divider class={style.divider} />

        <div class={style.container}>
          <span>Goals For:</span>
          <strong>
            {renderStatWithDifference(
              playerStats()!.goalsFor,
              comparedPlayerStats()?.goalsFor,
            )}
          </strong>

          <span>Goals Against:</span>
          <strong>
            {renderStatWithDifference(
              playerStats()!.goalsAgainst,
              comparedPlayerStats()?.goalsAgainst,
            )}
          </strong>

          <span>Goal Difference:</span>
          <strong>
            {renderStatWithDifference(
              playerStats()!.goalDifference,
              comparedPlayerStats()?.goalDifference,
            )}
          </strong>

          <span>Goal Ratio:</span>
          <strong>
            {renderStatWithDifference(
              playerStats()!.goalRatio,
              comparedPlayerStats()?.goalRatio,
              2,
            )}
          </strong>
        </div>
      </Show>
    </Modal>
  );
};
