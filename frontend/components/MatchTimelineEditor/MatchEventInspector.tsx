import { createMemo, For, Match, Show, Switch } from 'solid-js';
import { BallLabel } from '#components/BallLabel';
import { Button } from '#components/Button';
import { ButtonGroup, type ButtonGroupOption } from '#components/ButtonGroup';
import { formatDateStep } from '#components/DateInput';
import { Dropdown, type DropdownOption } from '#components/Dropdown';
import { FieldShell, fieldInputClassList } from '#components/Form';
import { Input } from '#components/Input';
import { MatchEventSymbol } from '#components/MatchTimelineTable';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { ResourcePicker } from '#components/ResourcePicker';
import { TextArea } from '#components/TextArea';
import { useCopyToClipboard } from '#flib/clipboard';
import {
  convertMatchEvent,
  formatElapsed,
  MATCH_EVENT_COARSE_TIME_STEP_MS,
  MATCH_EVENT_TIME_STEP_MS,
  MatchEventTypeLabels,
  MatchSideLabels,
  narrowMatchEvent,
} from '#flib/matchEvents';
import { queryBalls, queryBallsByIds } from '#flib/trpcCalls';
import {
  formatGoalTypeLabel,
  normalizeGoalTypeSelection,
} from '#shared/goalTypes';
import { getGoalScoringSide } from '#shared/matchTimeline';
import { msToSeconds, secondsToMs } from '#shared/timeUtils';
import type { Ball } from '#shared/types/api/ball';
import {
  type MatchEventType,
  MatchEventTypeEnum,
  type MatchSide,
  MatchSides,
} from '#shared/types/api/matchEvent';
import { shortUUID } from '#shared/utils';
import {
  useMatchTimelineEditor,
  useRemoveMatchEvent,
} from './MatchTimelineEditor';
import style from './MatchTimelineEditor.module.scss';
import { MatchTimelineIssues } from './MatchTimelineIssues';

export interface MatchEventInspectorProps {
  uuid: string;
}

const TypeOptions: DropdownOption<MatchEventType>[] = Object.values(
  MatchEventTypeEnum,
).map((type) => ({ label: MatchEventTypeLabels[type], value: type }));

const TimeSteps = [
  -MATCH_EVENT_COARSE_TIME_STEP_MS,
  -MATCH_EVENT_TIME_STEP_MS,
  MATCH_EVENT_TIME_STEP_MS,
  MATCH_EVENT_COARSE_TIME_STEP_MS,
];

export const MatchEventInspector: Component<MatchEventInspectorProps> = (
  props,
) => {
  const [draft, lookup] = useMatchTimelineEditor();

  const goalTypeOptions = createMemo((): DropdownOption[] =>
    lookup.goalTypes().map((goalType) => ({
      label: `${goalType.parentUuid ? '↳ ' : ''}${formatGoalTypeLabel(goalType)}`,
      value: goalType.uuid,
    })),
  );
  const copyToClipboard = useCopyToClipboard();

  const removeEvent = useRemoveMatchEvent(draft);

  const step = () => draft.getStep(props.uuid);

  const isInvalid = (field: string) =>
    draft.getEventSeverity(props.uuid, field) === 'ERROR';

  const sideOptions = createMemo((): ButtonGroupOption<MatchSide>[] =>
    MatchSides.map((side) => ({
      label: MatchSideLabels[side],
      value: side,
      color: lookup.getSideColor(side),
    })),
  );

  const playerOptionsBySide = createMemo(
    () =>
      Object.fromEntries(
        MatchSides.map((side) => [
          side,
          lookup.getSidePlayers(side).map(
            (player): ButtonGroupOption => ({
              label: lookup.getPlayerName(player),
              value: player,
            }),
          ),
        ]),
      ) as Record<MatchSide, ButtonGroupOption[]>,
  );

  const isForeignPlayer = (side: MatchSide, player: string) =>
    player !== '' && !lookup.getSidePlayers(side).includes(player);

  const handleTypeChange = (type: MatchEventType) => {
    draft.updateEvent(props.uuid, (event) =>
      event.type === type
        ? event
        : convertMatchEvent(event, type, lookup.timeline().match),
    );
  };

  const handleSideChange = (side: MatchSide) => {
    draft.updateEvent(props.uuid, (event) => {
      if (event.type === 'POSITION_CHANGE') return { ...event, side };
      if (event.type !== 'GOAL') return event;

      const players = lookup.getSidePlayers(side);

      return {
        ...event,
        side,
        player: players.includes(event.player)
          ? event.player
          : (players[0] ?? ''),
      };
    });
  };

  const handleOffsetChange = (value: string) => {
    const seconds = Number.parseFloat(value);

    if (Number.isNaN(seconds)) return;

    draft.setEventOffset(props.uuid, secondsToMs(seconds));
  };

  const handleDetailsInput = (value: string) => {
    draft.patchEvent(props.uuid, {
      details: value.trim() === '' ? null : value,
    });
  };

  return (
    <Show when={step()}>
      {(current) => (
        <div class={style.inspector}>
          <div class={style.inspectorHeader}>
            <span class={style.inspectorTitle}>
              <MatchEventSymbol event={current().event} />
              {MatchEventTypeLabels[current().event.type]}
              <span class={style.inspectorTime}>
                T+{formatElapsed(current().elapsed)}
              </span>
            </span>

            <button
              type="button"
              class={style.uuid}
              onClick={() => copyToClipboard(props.uuid, `UUID ${props.uuid}`)}
            >
              {shortUUID(props.uuid)}
            </button>
          </div>

          <FieldShell path="type" label="Type" required>
            <Dropdown
              classList={fieldInputClassList}
              options={TypeOptions}
              value={current().event.type}
              invalid={isInvalid('type')}
              onChange={handleTypeChange}
            />
          </FieldShell>

          <FieldShell path="offset" label="Time (seconds)" required>
            <span class={style.timeStepper}>
              <Input
                classList={fieldInputClassList}
                type="number"
                step={0.1}
                value={msToSeconds(current().event.offset).toFixed(1)}
                invalid={isInvalid('offset')}
                onChange={(ev) => handleOffsetChange(ev.currentTarget.value)}
              />

              <span class={style.buttonRow}>
                <For each={TimeSteps}>
                  {(shift) => (
                    <Button
                      severity="secondary"
                      padding={0}
                      title={`Move by ${formatDateStep(shift)}`}
                      onPointerUp={() => draft.nudgeEvent(props.uuid, shift)}
                    >
                      {formatDateStep(shift)}
                    </Button>
                  )}
                </For>
              </span>

              <span class={style.buttonRow}>
                <Button
                  severity="secondary"
                  padding={0}
                  title="Swap with the previous event"
                  disabled={current().index === 0}
                  onPointerUp={() => draft.shiftEvent(props.uuid, -1)}
                >
                  <MaterialSymbol symbol="keyboard_arrow_up" /> Earlier
                </Button>

                <Button
                  severity="secondary"
                  padding={0}
                  title="Swap with the next event"
                  disabled={current().index === draft.steps().length - 1}
                  onPointerUp={() => draft.shiftEvent(props.uuid, 1)}
                >
                  <MaterialSymbol symbol="keyboard_arrow_down" /> Later
                </Button>
              </span>
            </span>
          </FieldShell>

          <FieldShell
            inline
            path="ripple"
            label="Move later events"
            required={false}
          >
            <Input
              classList={fieldInputClassList}
              type="checkbox"
              checked={draft.ripple()}
              onChange={(ev) => draft.setRipple(ev.currentTarget.checked)}
            />
          </FieldShell>

          <Switch>
            <Match when={narrowMatchEvent(current().event, 'GOAL')}>
              {(goal) => (
                <>
                  <FieldShell path="side" label="Player side" required>
                    <ButtonGroup
                      ariaLabel="Player side"
                      options={sideOptions()}
                      value={goal().side}
                      invalid={isInvalid('side')}
                      onChange={handleSideChange}
                    />
                  </FieldShell>

                  <FieldShell path="player" label="Player" required>
                    <span class={style.buttonRow}>
                      <ButtonGroup
                        ariaLabel="Player"
                        options={playerOptionsBySide()[goal().side]}
                        value={goal().player}
                        invalid={isInvalid('player')}
                        onChange={(player) =>
                          draft.patchEvent(props.uuid, { player })
                        }
                      />

                      <Show when={isForeignPlayer(goal().side, goal().player)}>
                        <span class={style.invalidValue}>
                          {lookup.getPlayerName(goal().player)}
                        </span>
                      </Show>
                    </span>
                  </FieldShell>

                  <FieldShell inline path="ownGoal" label="Own goal" required>
                    <Input
                      classList={fieldInputClassList}
                      type="checkbox"
                      checked={goal().ownGoal}
                      onChange={(ev) =>
                        draft.patchEvent(props.uuid, {
                          ownGoal: ev.currentTarget.checked,
                        })
                      }
                    />
                  </FieldShell>

                  <span class={style.dimmed}>
                    Point for {MatchSideLabels[getGoalScoringSide(goal())]}
                  </span>

                  <FieldShell
                    path="goalType"
                    label="Goal type"
                    required={false}
                  >
                    <Dropdown
                      multiple
                      searchable
                      classList={fieldInputClassList}
                      options={goalTypeOptions()}
                      value={goal().goalType}
                      invalid={isInvalid('goalType')}
                      onChange={(goalType) =>
                        draft.patchEvent(props.uuid, {
                          goalType: normalizeGoalTypeSelection(
                            goal().goalType,
                            goalType,
                            lookup.goalTypes(),
                          ),
                        })
                      }
                    />
                  </FieldShell>
                </>
              )}
            </Match>

            <Match when={narrowMatchEvent(current().event, 'POSITION_CHANGE')}>
              {(positionChange) => (
                <FieldShell path="side" label="Side" required>
                  <ButtonGroup
                    ariaLabel="Side"
                    options={sideOptions()}
                    value={positionChange().side}
                    invalid={isInvalid('side')}
                    onChange={handleSideChange}
                  />
                </FieldShell>
              )}
            </Match>

            <Match when={narrowMatchEvent(current().event, 'BALL_CHANGE')}>
              {(ballChange) => (
                <FieldShell path="ball" label="Ball" required>
                  <ResourcePicker
                    classList={fieldInputClassList}
                    placeholder="Select a ball..."
                    query={queryBalls}
                    queryByIds={queryBallsByIds}
                    toEntry={(ball: Ball) => ({
                      label: <BallLabel ball={ball} />,
                      value: ball.uuid,
                    })}
                    value={ballChange().ball || undefined}
                    invalid={isInvalid('ball')}
                    onChange={(ball) =>
                      draft.patchEvent(props.uuid, { ball: ball ?? '' })
                    }
                  />
                </FieldShell>
              )}
            </Match>

            <Match
              when={narrowMatchEvent(
                current().event,
                'EQUIPMENT_FAILURE',
                'PAUSE',
                'CANCEL',
              )}
            >
              {(detailed) => (
                <>
                  <FieldShell path="details" label="Details" required={false}>
                    <TextArea
                      classList={fieldInputClassList}
                      placeholder="Details..."
                      value={detailed().details ?? ''}
                      invalid={isInvalid('details')}
                      onFocus={() => draft.beginTransaction()}
                      onBlur={() => draft.endTransaction()}
                      onInput={(ev) =>
                        handleDetailsInput(ev.currentTarget.value)
                      }
                    />
                  </FieldShell>

                  <Show when={narrowMatchEvent(detailed(), 'PAUSE')}>
                    {(pause) => (
                      <FieldShell
                        inline
                        path="countsAsPresence"
                        label="Counts as presence"
                        required
                      >
                        <Input
                          classList={fieldInputClassList}
                          type="checkbox"
                          checked={pause().countsAsPresence}
                          onChange={(ev) =>
                            draft.patchEvent(props.uuid, {
                              countsAsPresence: ev.currentTarget.checked,
                            })
                          }
                        />
                      </FieldShell>
                    )}
                  </Show>
                </>
              )}
            </Match>
          </Switch>

          <MatchTimelineIssues eventUuid={props.uuid} />

          <div class={style.buttonRow}>
            <Button
              severity="secondary"
              padding={0}
              onPointerUp={() => draft.duplicateEvent(props.uuid)}
            >
              <MaterialSymbol symbol="content_copy" /> Duplicate
            </Button>

            <Button
              severity="danger"
              padding={0}
              onPointerUp={() => removeEvent(props.uuid)}
            >
              <MaterialSymbol symbol="delete" /> Delete
            </Button>
          </div>
        </div>
      )}
    </Show>
  );
};
