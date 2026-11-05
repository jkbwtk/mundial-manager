import {
  type Accessor,
  batch,
  createEffect,
  createMemo,
  createSelector,
  createSignal,
  on,
} from 'solid-js';
import { parseServerFieldErrors } from '#flib/formValidation';
import { MATCH_EVENT_TIME_STEP_MS } from '#flib/matchEvents';
import { createUndoHistory } from '#flib/undoHistory';
import {
  getMatchSidePlayers,
  getMatchTimelineContext,
  getMatchTimelineErrorMessage,
  getMatchTimelinePauses,
  getMatchTimelineSteps,
  getOppositeSide,
  hasMatchTimelineErrors,
  isMatchPausedAt,
  isMatchTimelineError,
  type MatchTimelinePause,
  type MatchTimelineStep,
  validateMatchTimeline,
} from '#shared/matchTimeline';
import { MATCH_SIDE_MAX_PLAYERS, type Match } from '#shared/types/api/match';
import {
  MatchEvent,
  type MatchSide,
  MatchSides,
} from '#shared/types/api/matchEvent';
import {
  type MatchTimeline,
  type MatchTimelineErrorType,
  MatchTimelineErrorTypeEnum,
  type MatchTimelineIssue,
  type MatchTimelineIssueSeverity,
  MatchTimelineIssueSeverityEnum,
  type MatchTimelineMatchChanges,
  type MatchTimelineSave,
} from '#shared/types/api/matchTimeline';
import { clamp, getValueHash, memoizeByObject } from '#shared/utils';

export interface MatchTimelineDraftIssue {
  severity: MatchTimelineIssueSeverity;
  eventUuid: string | null;
  field: string | null;
  message: string;
}

export interface MatchTimelineDraftIssueCounts {
  errors: number;
  warnings: number;
}

export interface MatchTimelineDraftStep extends MatchTimelineStep<MatchEvent> {
  index: number;
}

export interface MatchTimelineDraftState {
  match: MatchTimelineMatchChanges;
  events: MatchEvent[];
}

export interface MatchTimelineDraftChanges {
  created: number;
  updated: number;
  removed: number;
}

type MatchEventFieldsPatch<T> = T extends MatchEvent
  ? Partial<Omit<T, 'uuid' | 'type'>>
  : never;

export type MatchEventPatch = MatchEventFieldsPatch<MatchEvent>;

export interface MatchTimelineDraft {
  original: Accessor<MatchEvent[]>;
  originalMatch: Accessor<Match | null>;
  state: Accessor<MatchTimelineDraftState>;
  events: Accessor<MatchEvent[]>;
  match: Accessor<Match | null>;
  steps: Accessor<MatchTimelineDraftStep[]>;

  getStep: (uuid: string) => MatchTimelineDraftStep | null;
  getEvent: (uuid: string) => MatchEvent | null;

  selectedUuid: Accessor<string | null>;
  selectedStep: Accessor<MatchTimelineDraftStep | null>;
  isSelected: (uuid: string) => boolean;
  setSelectedUuid: (uuid: string | null) => void;
  selectAdjacent: (direction: -1 | 1) => void;

  playhead: Accessor<number | null>;
  setPlayhead: (offset: number | null) => void;
  ripple: Accessor<boolean>;
  setRipple: (ripple: boolean) => void;
  getInsertOffset: () => number;

  score: Accessor<[number, number]>;
  pauseDuration: Accessor<number>;
  pauses: Accessor<MatchTimelinePause[]>;
  isPausedAt: (offset: number) => boolean;

  changes: Accessor<MatchTimelineDraftChanges>;
  matchChanges: Accessor<MatchTimelineMatchChanges>;
  isMatchChanged: Accessor<boolean>;
  isDirty: Accessor<boolean>;
  isCurrentState: (other: MatchTimelineDraftState) => boolean;

  issues: Accessor<MatchTimelineDraftIssue[]>;
  issueCounts: Accessor<MatchTimelineDraftIssueCounts>;
  hasErrors: Accessor<boolean>;
  getEventIssues: (uuid: string, field?: string) => MatchTimelineDraftIssue[];
  getEventSeverity: (
    uuid: string,
    field?: string,
  ) => MatchTimelineIssueSeverity | null;
  applyServerError: (error: unknown) => boolean;

  canUndo: Accessor<boolean>;
  canRedo: Accessor<boolean>;
  undo: () => void;
  redo: () => void;
  beginTransaction: () => void;
  endTransaction: () => void;

  load: (timeline: MatchTimeline) => void;
  restore: (state: MatchTimelineDraftState) => void;
  rebase: (sent: MatchTimelineSave, saved: MatchTimeline) => void;
  discard: () => void;
  toSaveInput: () => MatchTimelineSave | null;

  addEvent: (event: MatchEvent) => void;
  duplicateEvent: (uuid: string) => void;
  removeEvent: (uuid: string) => void;
  updateEvent: (
    uuid: string,
    update: (event: MatchEvent) => MatchEvent,
  ) => void;
  patchEvent: (uuid: string, patch: MatchEventPatch) => void;
  setEventOffset: (uuid: string, offset: number) => void;
  nudgeEvent: (uuid: string, shift: number) => void;
  moveEvent: (uuid: string, index: number) => void;
  shiftEvent: (uuid: string, direction: -1 | 1) => void;

  swapSides: () => void;
  replacePlayer: (from: string, to: string) => void;
  canTransferPlayer: (player: string, side: MatchSide) => boolean;
  transferPlayer: (player: string, side: MatchSide) => void;
}

const { ERROR, WARNING } = MatchTimelineIssueSeverityEnum;

const SidePlayersKeys: Record<MatchSide, 'playersSide1' | 'playersSide2'> = {
  SIDE_1: 'playersSide1',
  SIDE_2: 'playersSide2',
};

const OffsetSteps = [MATCH_EVENT_TIME_STEP_MS];

const ReferenceErrorTypes: Set<MatchTimelineErrorType> = new Set([
  MatchTimelineErrorTypeEnum.PLAYERS_NOT_FOUND,
  MatchTimelineErrorTypeEnum.BALL_NOT_FOUND,
]);

const FieldIssueMessages: Partial<Record<string, string>> = {
  player: 'Player has to be selected',
  ball: 'Ball has to be selected',
};

const getEventHash = memoizeByObject<MatchEvent, string>(getValueHash);

const getEventParseIssues = memoizeByObject(
  (event: MatchEvent): MatchTimelineDraftIssue[] => {
    const parsed = MatchEvent.safeParse(event);

    if (parsed.success) return [];

    return parsed.error.issues.map((issue) => {
      const field = String(issue.path.at(0) ?? 'event');

      return {
        severity: ERROR,
        eventUuid: event.uuid,
        field,
        message: FieldIssueMessages[field] ?? issue.message,
      };
    });
  },
);

function isSameEvent(a: MatchEvent, b: MatchEvent): boolean {
  return a === b || getEventHash(a) === getEventHash(b);
}

function getEventsByUuid(events: MatchEvent[]): Map<string, MatchEvent> {
  return new Map(events.map((event) => [event.uuid, event]));
}

function getEventUuids(events: MatchEvent[]): Set<string> {
  return new Set(events.map((event) => event.uuid));
}

function getChangedMatchFields(
  changes: MatchTimelineMatchChanges,
  reference: MatchTimelineMatchChanges,
): MatchTimelineMatchChanges {
  return Object.fromEntries(
    Object.entries(changes).filter(
      ([field, value]) =>
        getValueHash(value) !==
        getValueHash(reference[field as keyof MatchTimelineMatchChanges]),
    ),
  );
}

function getPlayerSide(match: Match, player: string): MatchSide | null {
  return (
    MatchSides.find((side) =>
      getMatchSidePlayers(match, side).includes(player),
    ) ?? null
  );
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function getOffsetBetween(previous: number, next: number): number {
  const middle = (previous + next) / 2;

  for (const step of OffsetSteps) {
    const offset = roundToStep(middle, step);

    if (offset >= previous && offset <= next) return offset;
  }

  return Math.round(middle);
}

function getMovedOffset(
  previous: MatchEvent | undefined,
  next: MatchEvent | undefined,
  fallback: number,
): number {
  const step = MATCH_EVENT_TIME_STEP_MS;

  if (previous && next) return getOffsetBetween(previous.offset, next.offset);
  if (previous) return (Math.floor(previous.offset / step) + 1) * step;
  if (next) return (Math.ceil(next.offset / step) - 1) * step;

  return fallback;
}

function getDraftChanges(
  original: MatchEvent[],
  events: MatchEvent[],
): MatchTimelineDraftChanges {
  const originalByUuid = getEventsByUuid(original);
  const eventUuids = getEventUuids(events);

  let created = 0;
  let updated = 0;

  for (const event of events) {
    const source = originalByUuid.get(event.uuid);

    if (source === undefined) {
      created += 1;
    } else if (!isSameEvent(source, event)) {
      updated += 1;
    }
  }

  const removed = original.filter(
    (event) => !eventUuids.has(event.uuid),
  ).length;

  return { created, updated, removed };
}

function rebaseEvents(
  current: MatchEvent[],
  sent: MatchEvent[],
  saved: MatchEvent[],
): MatchEvent[] {
  const sentByUuid = getEventsByUuid(sent);
  const savedByUuid = getEventsByUuid(saved);
  const currentUuids = getEventUuids(current);

  const rebased = current.flatMap((event) => {
    const sentEvent = sentByUuid.get(event.uuid);

    if (sentEvent === undefined || !isSameEvent(sentEvent, event)) {
      return [event];
    }

    const savedEvent = savedByUuid.get(event.uuid);

    return savedEvent ? [savedEvent] : [];
  });

  const added = saved.filter(
    (event) => !sentByUuid.has(event.uuid) && !currentUuids.has(event.uuid),
  );

  return [...rebased, ...added];
}

function toDraftIssue(issue: MatchTimelineIssue): MatchTimelineDraftIssue {
  return {
    severity: issue.severity,
    eventUuid: issue.eventUuid,
    field: issue.field,
    message: getMatchTimelineErrorMessage(issue.errorType),
  };
}

function getReferenceIssues(
  timeline: MatchTimeline,
  events: MatchEvent[],
): MatchTimelineIssue[] {
  const eventUuids = getEventUuids(events);

  return timeline.issues.filter(
    (issue) =>
      ReferenceErrorTypes.has(issue.errorType) &&
      (issue.eventUuid === null || eventUuids.has(issue.eventUuid)),
  );
}

function getServerIssues(error: unknown): MatchTimelineDraftIssue[] {
  return parseServerFieldErrors(error).flatMap(([path, errorTypes]) => {
    const [scope, eventUuid = null, field = null] = path.split('.');
    const isEventPath = scope === 'events';

    return errorTypes.map((errorType) => ({
      severity: ERROR,
      eventUuid: isEventPath ? eventUuid : null,
      field: isEventPath ? field : path,
      message: getMatchTimelineErrorMessage(errorType),
    }));
  });
}

function groupIssuesByEvent(
  issues: MatchTimelineDraftIssue[],
): Map<string, MatchTimelineDraftIssue[]> {
  const grouped = new Map<string, MatchTimelineDraftIssue[]>();

  for (const issue of issues) {
    if (issue.eventUuid === null) continue;

    const group = grouped.get(issue.eventUuid) ?? [];

    group.push(issue);
    grouped.set(issue.eventUuid, group);
  }

  return grouped;
}

export function getMatchTimelineDraftSteps(
  events: MatchEvent[],
): MatchTimelineDraftStep[] {
  return getMatchTimelineSteps(events).map((step, index) => ({
    ...step,
    index,
  }));
}

export function createMatchTimelineDraft(
  timeline: Accessor<MatchTimeline | undefined>,
): MatchTimelineDraft {
  const [original, setOriginal] = createSignal<MatchEvent[]>([]);
  const [originalMatch, setOriginalMatch] = createSignal<Match | null>(null);
  const [state, setState] = createSignal<MatchTimelineDraftState>({
    match: {},
    events: [],
  });
  const [serverIssues, setServerIssues] = createSignal<
    MatchTimelineDraftIssue[]
  >([]);

  const [selectedUuid, setSelectedUuid] = createSignal<string | null>(null);
  const [playhead, setPlayhead] = createSignal<number | null>(null);
  const [ripple, setRipple] = createSignal(false);

  const history = createUndoHistory(state, (next) => setState(next));

  const events = createMemo(() => state().events);

  const matchState = createMemo(() => state().match);

  const match = createMemo(() => {
    const base = originalMatch();

    return base ? { ...base, ...matchState() } : null;
  });

  const matchChanges = createMemo(() => {
    const base = originalMatch();

    return base ? getChangedMatchFields(matchState(), base) : {};
  });

  const isMatchChanged = () => Object.keys(matchChanges()).length > 0;

  const steps = createMemo(() => getMatchTimelineDraftSteps(events()));

  const stepsByUuid = createMemo(
    () => new Map(steps().map((step) => [step.event.uuid, step])),
  );

  const sortedEvents = () => steps().map((step) => step.event);

  const getStep = (uuid: string) => stepsByUuid().get(uuid) ?? null;

  const getEvent = (uuid: string) => getStep(uuid)?.event ?? null;

  const isSelected = createSelector(selectedUuid);

  const selectedStep = createMemo(() => {
    const uuid = selectedUuid();

    return uuid === null ? null : getStep(uuid);
  });

  const score = (): [number, number] => steps().at(-1)?.score ?? [0, 0];

  const pauseDuration = () => steps().at(-1)?.pauseDuration ?? 0;

  const pauses = createMemo(() => getMatchTimelinePauses(steps()));

  const isPausedAt = (offset: number) => isMatchPausedAt(pauses(), offset);

  const changes = createMemo(() => getDraftChanges(original(), events()));

  const isDirty = createMemo(() => {
    const { created, updated, removed } = changes();

    return created + updated + removed > 0 || isMatchChanged();
  });

  const isCurrentState = (other: MatchTimelineDraftState) => {
    const base = originalMatch();
    const otherChanges = base
      ? getChangedMatchFields(other.match, base)
      : other.match;

    return (
      getValueHash({ match: otherChanges, events: other.events }) ===
      getValueHash({ match: matchChanges(), events: events() })
    );
  };

  const issues = createMemo((): MatchTimelineDraftIssue[] => {
    const source = timeline();
    const current = match();
    const context = current ? getMatchTimelineContext(current) : {};
    const timelineIssues = [
      ...validateMatchTimeline(events(), context),
      ...(source ? getReferenceIssues(source, events()) : []),
    ];

    return [
      ...events().flatMap(getEventParseIssues),
      ...timelineIssues.map(toDraftIssue),
      ...serverIssues(),
    ];
  });

  const issuesByEvent = createMemo(() => groupIssuesByEvent(issues()));

  const issueCounts = createMemo(() => {
    const errors = issues().filter(isMatchTimelineError).length;

    return { errors, warnings: issues().length - errors };
  });

  const hasErrors = () => issueCounts().errors > 0;

  const getEventIssues = (uuid: string, field?: string) => {
    const eventIssues = issuesByEvent().get(uuid) ?? [];

    if (field === undefined) return eventIssues;

    return eventIssues.filter((issue) => issue.field === field);
  };

  const getEventSeverity = (uuid: string, field?: string) => {
    const eventIssues = getEventIssues(uuid, field);

    if (eventIssues.length === 0) return null;

    return hasMatchTimelineErrors(eventIssues) ? ERROR : WARNING;
  };

  const applyServerError = (error: unknown) => {
    const mapped = getServerIssues(error);

    if (mapped.length === 0) return false;

    setServerIssues(mapped);

    return true;
  };

  const selectAdjacent = (direction: -1 | 1) => {
    const current = selectedStep();
    const target =
      current === null
        ? steps().at(direction === 1 ? 0 : -1)
        : steps()[current.index + direction];

    if (target) setSelectedUuid(target.event.uuid);
  };

  const getInsertOffset = () => {
    const head = playhead();

    if (head !== null) return head;

    const reference = selectedStep()?.event ?? steps().at(-1)?.event;

    return reference ? reference.offset + MATCH_EVENT_TIME_STEP_MS : 0;
  };

  const commit = (next: MatchTimelineDraftState) => {
    const base = originalMatch();
    const changes = base ? getChangedMatchFields(next.match, base) : next.match;

    batch(() => {
      history.commit({ ...next, match: changes });
      setServerIssues([]);
    });
  };

  const commitEvents = (next: MatchEvent[]) => {
    commit({ ...state(), events: next });
  };

  const load = (source: MatchTimeline) => {
    batch(() => {
      history.reset();
      setOriginal(source.events);
      setOriginalMatch(source.match);
      setState({ match: {}, events: source.events });
      setServerIssues([]);

      if (!source.events.some((event) => event.uuid === selectedUuid())) {
        setSelectedUuid(null);
      }
    });
  };

  const rebase = (sent: MatchTimelineSave, saved: MatchTimeline) => {
    history.cancelTransaction();

    batch(() => {
      setState({
        match: getChangedMatchFields(state().match, saved.match),
        events: rebaseEvents(events(), sent.events, saved.events),
      });
      setOriginal(saved.events);
      setOriginalMatch(saved.match);
      setServerIssues([]);
    });
  };

  const discard = () => {
    const source = timeline();

    if (source) load(source);
  };

  const toSaveInput = () => {
    const source = timeline();

    if (!source) return null;

    return {
      matchUuid: source.match.uuid,
      events: sortedEvents(),
      match: isMatchChanged() ? matchChanges() : undefined,
    };
  };

  const addEvent = (event: MatchEvent) => {
    batch(() => {
      commitEvents([...events(), event]);
      setSelectedUuid(event.uuid);
      setPlayhead(null);
    });
  };

  const duplicateEvent = (uuid: string) => {
    const event = getEvent(uuid);

    if (event === null) return;

    addEvent({
      ...event,
      uuid: crypto.randomUUID(),
      offset: event.offset + MATCH_EVENT_TIME_STEP_MS,
    });
  };

  const removeEvent = (uuid: string) => {
    const step = getStep(uuid);

    if (step === null) return;

    const neighbor = steps()[step.index + 1] ?? steps()[step.index - 1];

    batch(() => {
      commitEvents(events().filter((event) => event.uuid !== uuid));

      if (selectedUuid() === uuid) {
        setSelectedUuid(neighbor?.event.uuid ?? null);
      }
    });
  };

  const updateEvent = (
    uuid: string,
    update: (event: MatchEvent) => MatchEvent,
  ) => {
    const current = getEvent(uuid);

    if (current === null) return;

    const updated = update(current);

    if (isSameEvent(updated, current)) return;

    commitEvents(
      events().map((event) => (event.uuid === uuid ? updated : event)),
    );
  };

  const patchEvent = (uuid: string, patch: MatchEventPatch) => {
    updateEvent(uuid, (event) => ({ ...event, ...patch }) as MatchEvent);
  };

  const setEventOffset = (uuid: string, offset: number) => {
    const target = Math.round(offset);

    if (getEvent(uuid)?.offset === target) return;

    const base = history.getTransactionBase()?.events ?? events();
    const from = base.find((event) => event.uuid === uuid)?.offset;

    if (from === undefined) return;

    const shift = target - from;
    const isShifted = (event: MatchEvent) =>
      event.uuid === uuid || (ripple() && event.offset > from);

    commitEvents(
      base.map((event) =>
        isShifted(event) ? { ...event, offset: event.offset + shift } : event,
      ),
    );
  };

  const nudgeEvent = (uuid: string, shift: number) => {
    const event = getEvent(uuid);

    if (event === null) return;

    setEventOffset(uuid, event.offset + shift);
  };

  const moveEvent = (uuid: string, targetIndex: number) => {
    const event = getEvent(uuid);

    if (event === null) return;

    const others = sortedEvents().filter((entry) => entry.uuid !== uuid);
    const index = clamp(0, others.length, targetIndex);
    const offset = getMovedOffset(
      others[index - 1],
      others[index],
      event.offset,
    );

    commitEvents(others.toSpliced(index, 0, { ...event, offset }));
  };

  const shiftEvent = (uuid: string, direction: -1 | 1) => {
    const step = getStep(uuid);

    if (step === null) return;

    const neighbour = steps()[step.index + direction];

    if (neighbour === undefined) return;

    const reordered = sortedEvents();

    reordered[step.index] = { ...neighbour.event, offset: step.event.offset };
    reordered[neighbour.index] = {
      ...step.event,
      offset: neighbour.event.offset,
    };

    commitEvents(reordered);
  };

  const swapSides = () => {
    const current = match();

    if (current === null) return;

    commit({
      match: {
        ...state().match,
        playersSide1: current.playersSide2,
        playersSide2: current.playersSide1,
      },
      events: events().map((event) =>
        'side' in event
          ? { ...event, side: getOppositeSide(event.side) }
          : event,
      ),
    });
  };

  const replacePlayer = (from: string, to: string) => {
    const current = match();

    if (current === null) return;

    const side = getPlayerSide(current, from);

    if (side === null || getPlayerSide(current, to) !== null) return;

    const key = SidePlayersKeys[side];

    commit({
      match: {
        ...state().match,
        [key]: current[key].map((uuid) => (uuid === from ? to : uuid)),
        spectators: current.spectators.filter((uuid) => uuid !== to),
      },
      events: events().map((event) =>
        event.type === 'GOAL' && event.player === from
          ? { ...event, player: to }
          : event,
      ),
    });
  };

  const canTransferPlayer = (player: string, side: MatchSide) => {
    const current = match();

    if (current === null) return false;

    const from = getPlayerSide(current, player);

    if (from === null || from === side) return false;

    return (
      getMatchSidePlayers(current, from).length > 1 &&
      getMatchSidePlayers(current, side).length < MATCH_SIDE_MAX_PLAYERS
    );
  };

  const transferPlayer = (player: string, side: MatchSide) => {
    const current = match();

    if (current === null || !canTransferPlayer(player, side)) return;

    const fromKey = SidePlayersKeys[getOppositeSide(side)];
    const toKey = SidePlayersKeys[side];

    commit({
      match: {
        ...state().match,
        [fromKey]: current[fromKey].filter((uuid) => uuid !== player),
        [toKey]: [...current[toKey], player],
      },
      events: events().map((event) =>
        event.type === 'GOAL' && event.player === player
          ? { ...event, side }
          : event,
      ),
    });
  };

  createEffect(
    on(timeline, (source) => {
      if (!source) return;

      if (isDirty()) {
        setOriginalMatch(source.match);

        return;
      }

      load(source);
    }),
  );

  return {
    original,
    originalMatch,
    state,
    events,
    match,
    steps,

    getStep,
    getEvent,

    selectedUuid,
    selectedStep,
    isSelected,
    setSelectedUuid,
    selectAdjacent,

    playhead,
    setPlayhead,
    ripple,
    setRipple,
    getInsertOffset,

    score,
    pauseDuration,
    pauses,
    isPausedAt,

    changes,
    matchChanges,
    isMatchChanged,
    isDirty,
    isCurrentState,

    issues,
    issueCounts,
    hasErrors,
    getEventIssues,
    getEventSeverity,
    applyServerError,

    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo: history.undo,
    redo: history.redo,
    beginTransaction: history.beginTransaction,
    endTransaction: history.endTransaction,

    load,
    restore: commit,
    rebase,
    discard,
    toSaveInput,

    addEvent,
    duplicateEvent,
    removeEvent,
    updateEvent,
    patchEvent,
    setEventOffset,
    nudgeEvent,
    moveEvent,
    shiftEvent,

    swapSides,
    replacePlayer,
    canTransferPlayer,
    transferPlayer,
  };
}
