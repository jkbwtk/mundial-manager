import { For, getOwner } from 'solid-js';
import { ActionMenu, type ActionMenuItem } from '#components/ActionMenu';
import { Button } from '#components/Button';
import { ColorBlock } from '#components/ColorBlock';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { PlayerPickerModal } from '#components/PlayerPickerModal';
import { useModal } from '#providers/ModalProvider';
import { getMatchPlayerUuids } from '#shared/matchPlayers';
import { getOppositeSide } from '#shared/matchTimeline';
import { type MatchSide, MatchSides } from '#shared/types/api/matchEvent';
import { useMatchTimelineEditor } from './MatchTimelineEditor';
import style from './MatchTimelineEditor.module.scss';

export const MatchQuickActions: Component = () => {
  const [draft, lookup] = useMatchTimelineEditor();
  const [, { open }] = useModal();

  const owner = getOwner();

  const openReplacePicker = (player: string) => {
    open({
      props: {
        component: PlayerPickerModal,
        disabledPlayers: getMatchPlayerUuids(lookup.timeline().match),
      },
      owner,
      afterClose: (picked) => {
        if (typeof picked === 'string') draft.replacePlayer(player, picked);
      },
    });
  };

  const getSideItems = (side: MatchSide): ActionMenuItem[] =>
    lookup.getSortedSidePlayers(side).flatMap((player) => [
      {
        label: `Replace ${lookup.getPlayerName(player)}`,
        symbol: 'change_circle',
        onSelect: () => openReplacePicker(player),
      },
      {
        label: `Move ${lookup.getPlayerName(player)} to other side`,
        symbol: 'arrow_forward',
        onSelect: () => draft.transferPlayer(player, getOppositeSide(side)),
        disabled: !draft.canTransferPlayer(player, getOppositeSide(side)),
      },
    ]);

  return (
    <div class={style.buttonRow}>
      <Button severity="secondary" padding={0} onClick={draft.swapSides}>
        <MaterialSymbol symbol="swap_horiz" /> Swap sides
      </Button>

      <Button
        severity="secondary"
        padding={0}
        disabled={!draft.canSyncDuration()}
        onClick={draft.syncDuration}
      >
        <MaterialSymbol symbol="timer" /> Sync length
      </Button>

      <For each={MatchSides}>
        {(side, index) => (
          <span class={style.lineupSide}>
            <ColorBlock color={lookup.getSideColor(side)} width={2} />

            <ActionMenu
              label={`Side ${index() + 1} players`}
              items={getSideItems(side)}
            />
          </span>
        )}
      </For>
    </div>
  );
};
