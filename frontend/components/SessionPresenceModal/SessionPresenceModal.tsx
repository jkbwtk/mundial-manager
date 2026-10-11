import { useAction } from '@solidjs/router';
import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  on,
  Show,
} from 'solid-js';
import { Button } from '#components/Button';
import { FieldShell, fieldInputClassList } from '#components/Form';
import { Input } from '#components/Input';
import { Modal } from '#components/Modal';
import { MultiResourcePicker } from '#components/ResourcePicker';
import { StatRow } from '#components/StatRow';
import { SummaryRow } from '#components/SummaryRow';
import { type Column, Table } from '#components/Table';
import { Divider } from '#components/Widget';
import { createResilientAsync } from '#flib/resilientAsync';
import { useHandleButtonAction } from '#flib/solidHelpers';
import {
  actionSaveMatchSessionSpectators,
  queryMatchSession,
  queryPlayers,
  queryPlayersByIds,
} from '#flib/trpcCalls';
import { useModalActions } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import { formatExactStartTime } from '#shared/matchLabels';
import { isMatchPlayer } from '#shared/matchPlayers';
import { formatStatsSessionKey } from '#shared/stats/buckets';
import { getStatsSessionSpan } from '#shared/stats/presence';
import { formatTimeMs } from '#shared/timeUtils';
import type { Match } from '#shared/types/api/match';
import type { Player } from '#shared/types/api/player';
import style from './SessionPresenceModal.module.scss';

export interface SessionPresenceModalProps {
  matchUuid: string;
}

export const SessionPresenceModal: Component<SessionPresenceModalProps> = (
  props,
) => {
  const [, actions] = useToast();
  const { closeModal } = useModalActions();

  const session = createResilientAsync(
    () => props.matchUuid,
    queryMatchSession,
  );

  const saveSessionSpectators = useAction(actionSaveMatchSessionSpectators);

  const [spectators, setSpectators] = createSignal<Record<string, string[]>>(
    {},
  );
  const [roster, setRoster] = createSignal<string[]>([]);
  const [players, setPlayers] = createSignal<Player[]>([]);

  const matches = () => session.latest?.matches ?? [];

  const isPlayingInSession = (playerUuid: string) =>
    matches().some((match) => isMatchPlayer(match, playerUuid));

  const people = createMemo(() =>
    players()
      .filter(
        (player) =>
          isPlayingInSession(player.uuid) || roster().includes(player.uuid),
      )
      .toSorted((a, b) => a.name.localeCompare(b.name)),
  );

  const playerCount = () =>
    people().filter((player) => isPlayingInSession(player.uuid)).length;

  const timeSpan = () => {
    const span = getStatsSessionSpan(matches());

    if (span === null) return formatTimeMs(null);

    return `${formatTimeMs(span[0])} - ${formatTimeMs(span[1])}`;
  };

  const isPresent = (match: Match, playerUuid: string) =>
    isMatchPlayer(match, playerUuid) ||
    (spectators()[match.uuid] ?? []).includes(playerUuid);

  const setSpectating = (
    playerUuid: string,
    spectating: boolean,
    targets: Match[] = matches(),
  ) => {
    setSpectators((current) => {
      const next = { ...current };

      for (const match of targets) {
        if (isMatchPlayer(match, playerUuid)) continue;

        const others = (current[match.uuid] ?? []).filter(
          (uuid) => uuid !== playerUuid,
        );

        next[match.uuid] = spectating ? [...others, playerUuid] : others;
      }

      return next;
    });
  };

  const addSpectator = async (playerUuid: string) => {
    setSpectating(playerUuid, true);

    if (players().some((player) => player.uuid === playerUuid)) return;

    try {
      const [player] = await queryPlayersByIds([playerUuid]);

      if (player === undefined) return;

      setPlayers((current) => [...current, player]);
    } catch (err) {
      console.error('Session presence player error:', err);
      actions.error('Failed to add spectator');
    }
  };

  const updateRoster = (uuids: string[]) => {
    const previous = roster();
    const played = uuids.filter(isPlayingInSession);
    const spectatorUuids = uuids.filter((uuid) => !isPlayingInSession(uuid));

    batch(() => {
      setRoster(spectatorUuids);

      for (const uuid of previous) {
        if (!spectatorUuids.includes(uuid)) setSpectating(uuid, false);
      }

      for (const uuid of spectatorUuids) {
        if (!previous.includes(uuid)) addSpectator(uuid);
      }

      for (const uuid of played) {
        setSpectating(uuid, true);
      }
    });

    if (played.length === 0) return;

    actions.info(
      `${played.map((uuid) => players().find((player) => player.uuid === uuid)?.name ?? uuid).join(', ')} played in this session, marked as present instead`,
    );
  };

  const handleSave = useHandleButtonAction(
    async () => {
      await saveSessionSpectators({
        matches: matches().map((match) => ({
          uuid: match.uuid,
          spectators: spectators()[match.uuid] ?? [],
        })),
      });

      actions.success('Session presence saved successfully!');
      closeModal(true);
    },
    (err) => {
      console.error('Session presence save error:', err);
      actions.error('Failed to save session presence');
    },
  );

  createEffect(
    on(
      () => session.latest,
      (current) => {
        if (current === undefined) return;

        const spectatorUuids = current.players
          .map((player) => player.uuid)
          .filter((uuid) => !isPlayingInSession(uuid));

        setPlayers(current.players);
        setSpectators(
          Object.fromEntries(
            current.matches.map((match) => [match.uuid, match.spectators]),
          ),
        );
        setRoster(spectatorUuids);
      },
    ),
  );

  const columns = createMemo((): Column[] => [
    {
      key: 'name',
      header: 'Player',
      align: 'left',
    },
    ...matches().map(
      (match): Column => ({
        key: match.uuid,
        header: formatExactStartTime(match),
        align: 'center',
        width: 7,
        transform: (_, player: Player) => (
          <Show
            when={!isMatchPlayer(match, player.uuid)}
            fallback={<span class={style.played}>●</span>}
          >
            <Input
              type="checkbox"
              checked={isPresent(match, player.uuid)}
              onChange={(ev) =>
                setSpectating(player.uuid, ev.currentTarget.checked, [match])
              }
            />
          </Show>
        ),
      }),
    ),
    {
      key: 'session',
      header: 'Session',
      align: 'center',
      width: 10,
      transform: (_, player: Player) => (
        <Button
          type="button"
          severity="secondary"
          onClick={() =>
            setSpectating(
              player.uuid,
              !matches().every((match) => isPresent(match, player.uuid)),
            )
          }
        >
          All
        </Button>
      ),
    },
  ]);

  return (
    <Modal
      topLeftLabels="Session Presence"
      bottomLeftLabels={[
        <Button severity="secondary" onPointerUp={() => closeModal(false)}>
          Cancel
        </Button>,
      ]}
      bottomRightLabels={[
        <Button
          severity="primary"
          onPointerUp={handleSave}
          loading={handleSave.loading()}
          disabled={matches().length === 0}
        >
          Save
        </Button>,
      ]}
      class={style.modal}
    >
      <div class={style.container}>
        <div class={style.header}>
          <Show
            when={session.latest?.key}
            fallback={
              <span class={style.notice}>
                Match has no exact start time, only its own presence can be
                edited
              </span>
            }
          >
            {(key) => (
              <div class={style.summary}>
                <SummaryRow
                  items={[
                    {
                      symbol: 'calendar_month',
                      value: formatStatsSessionKey(key()),
                    },
                    {
                      symbol: 'table_restaurant',
                      value: session.latest?.table?.name ?? '-',
                    },
                    { symbol: 'timer', value: timeSpan() },
                  ]}
                />

                <StatRow
                  items={[
                    {
                      symbol: 'sports_soccer',
                      value: matches().length,
                      label: 'matches',
                    },
                    {
                      symbol: 'groups',
                      value: playerCount(),
                      label: 'players',
                    },
                    {
                      symbol: 'visibility',
                      value: roster().length,
                      label: 'spectators',
                    },
                  ]}
                />
              </div>
            )}
          </Show>

          <Divider />
        </div>

        <div class={style.tableContainer}>
          <Table
            class={style.table}
            columns={columns()}
            data={people()}
            classic={false}
          />
        </div>

        <FieldShell path="spectators" label="Spectators" required={false}>
          <MultiResourcePicker
            classList={fieldInputClassList}
            name="spectators"
            query={queryPlayers}
            queryByIds={queryPlayersByIds}
            toEntry={(player: Player) => ({
              label: player.name,
              value: player.uuid,
            })}
            value={roster()}
            isPreselected={isPlayingInSession}
            onChange={updateRoster}
          />
        </FieldShell>
      </div>
    </Modal>
  );
};
