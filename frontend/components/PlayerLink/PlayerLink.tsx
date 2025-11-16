import { PlayerProfileModal } from '#components/PlayerProfileModal';
import { useModal } from '#providers/ModalProvider';
import style from './PlayerLink.module.scss';

export interface PlayerLinkProps {
  name: string;
}

export const PlayerLink: Component<PlayerLinkProps> = (props) => {
  const [, { open }] = useModal();

  const openPlayerProfileModal = () => {
    open({
      props: {
        component: PlayerProfileModal,
        name: props.name,
      },
    });
  };

  return (
    <button
      class={style.link}
      type="button"
      onPointerUp={openPlayerProfileModal}
    >
      {props.name}
    </button>
  );
};
