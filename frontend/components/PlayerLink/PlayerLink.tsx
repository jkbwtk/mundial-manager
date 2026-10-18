import { getOwner } from 'solid-js';
import { PlayerProfileModal } from '#components/PlayerProfileModal';
import { useModal } from '#providers/ModalProvider';
import style from './PlayerLink.module.scss';

export interface PlayerLinkProps {
  uuid: string;
  name: string;
}

export const PlayerLink: Component<PlayerLinkProps> = (props) => {
  const [, { open }] = useModal();
  const owner = getOwner();

  const openPlayerProfileModal = () => {
    open({
      props: {
        component: PlayerProfileModal,
        playerUuid: props.uuid,
      },
      owner,
    });
  };

  return (
    <button class={style.link} type="button" onClick={openPlayerProfileModal}>
      {props.name}
    </button>
  );
};
