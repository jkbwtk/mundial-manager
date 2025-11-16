import { For } from 'solid-js';
import { Button } from '#components/Button';
import { PlayerLink } from '#components/PlayerLink';
import { PlayerProfileModal } from '#components/PlayerProfileModal';
import { Divider, Widget } from '#components/Widget';
import { useModal } from '#providers/ModalProvider';
import { useSheets } from '#providers/SheetsProvider';
import style from './PlayerProfileTest.module.scss';

const PlayerProfileTest: Component = () => {
  const [, { open }] = useModal();
  const [, { latest }] = useSheets();

  const openPlayerProfileModal = (playerName: string) => {
    open({
      props: {
        component: PlayerProfileModal,
        name: playerName,
      },
    });
  };

  return (
    <Widget topLeftLabels="User Profile Test Page" class={style.container}>
      <br />
      <strong>Players: </strong>
      <For each={latest().matchStats.generalStats.uniquePlayers}>
        {(player) => (
          <Button
            severity="secondary"
            onPointerUp={() => openPlayerProfileModal(player)}
          >
            {player}
          </Button>
        )}
      </For>

      <Divider />

      <strong>PlayerLink test</strong>

      <For each={latest().matchStats.generalStats.uniquePlayers}>
        {(player) => (
          <div>
            - <PlayerLink name={player} />
          </div>
        )}
      </For>
    </Widget>
  );
};

export default PlayerProfileTest;
