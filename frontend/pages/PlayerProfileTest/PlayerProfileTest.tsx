import { For, getOwner } from 'solid-js';
import { Button } from '#components/Button';
import { PlayerLink } from '#components/PlayerLink';
import { PlayerProfileModal } from '#components/PlayerProfileModal';
import { Divider } from '#components/Widget';
import { usePlayerLookup } from '#flib/entityLookup';
import { useModal } from '#providers/ModalProvider';
import style from './PlayerProfileTest.module.scss';

const PlayerProfileTest: Component = () => {
  const [, { open }] = useModal();
  const owner = getOwner();
  const players = usePlayerLookup();

  const openPlayerProfileModal = (playerUuid: string) => {
    open({
      props: {
        component: PlayerProfileModal,
        playerUuid,
      },
      owner,
    });
  };

  return (
    <div class={style.container}>
      <strong>Players: </strong>
      <For each={players.all()}>
        {(player) => (
          <Button
            severity="secondary"
            onClick={() => openPlayerProfileModal(player.uuid)}
          >
            {player.name}
          </Button>
        )}
      </For>

      <Divider />

      <strong>PlayerLink test</strong>

      <For each={players.all()}>
        {(player) => (
          <div>
            - <PlayerLink uuid={player.uuid} name={player.name} />
          </div>
        )}
      </For>
    </div>
  );
};

export default PlayerProfileTest;
