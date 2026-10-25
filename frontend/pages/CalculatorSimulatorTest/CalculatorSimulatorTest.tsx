import {
  type Connection,
  connect,
  type RemoteProxy,
  WindowMessenger,
} from 'penpal';
import {
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';
import { isServer } from 'solid-js/web';
import { Button } from '#components/Button';
import { Dropdown } from '#components/Dropdown';
import { Divider, Widget } from '#components/Widget';
import { formatElapsed } from '#flib/matchEvents';
import { getMatchSidePlayers } from '#shared/matchTimeline';
import { DAY_MS } from '#shared/timeUtils';
import type { Ball } from '#shared/types/api/ball';
import type { Match } from '#shared/types/api/match';
import type { MatchEvent, MatchSide } from '#shared/types/api/matchEvent';
import type { Player } from '#shared/types/api/player';
import type { Table } from '#shared/types/api/table';
import type { CalculatorApi } from '#shared/types/MundialCalculator';
import style from './CalculatorSimulatorTest.module.scss';
import {
  type CalculatorScenario,
  CalculatorScenarios,
} from './calculatorScenarios';
import {
  type CalculatorRemote,
  createSimulatedMatch,
  type SimulatedMatch,
} from './simulatedMatch';

const ConnectionStateEnum = {
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  STANDALONE: 'STANDALONE',
  FAILED: 'FAILED',
} as const;

type ConnectionState =
  (typeof ConnectionStateEnum)[keyof typeof ConnectionStateEnum];

const ScenarioStateEnum = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  PASSED: 'PASSED',
  FAILED: 'FAILED',
} as const;

type ScenarioState = (typeof ScenarioStateEnum)[keyof typeof ScenarioStateEnum];

interface ScenarioResult {
  state: ScenarioState;
  message: string | null;
  duration: number | null; // milliseconds
}

interface LogEntry {
  id: number;
  time: Date;
  message: string;
  error: boolean;
}

const DEMO_GOAL_INTERVAL_MS = 4000;
const HOST_CONNECT_RETRY_MS = 3000;
const DEMO_TARGET_SCORE = 10;
const LOG_LIMIT = 200;

const ConnectionStateLabels: Record<ConnectionState, string> = {
  CONNECTING: 'Connecting to host...',
  CONNECTED: 'Connected to host',
  STANDALONE: 'Not embedded, open this page through the Iframe Test host',
  FAILED: 'Connection to host failed',
};

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export const CalculatorSimulatorTest: Component = () => {
  const [connection, setConnection] = createSignal<ConnectionState>(
    ConnectionStateEnum.CONNECTING,
  );
  const [api, setApi] = createSignal<CalculatorRemote | null>(null);

  const [tables, setTables] = createSignal<Table[]>([]);
  const [players, setPlayers] = createSignal<Player[]>([]);
  const [balls, setBalls] = createSignal<Ball[]>([]);

  const [tableUuid, setTableUuid] = createSignal<string | null>(null);
  const [playersSide1, setPlayersSide1] = createSignal<string[]>([]);
  const [playersSide2, setPlayersSide2] = createSignal<string[]>([]);

  const [match, setMatch] = createSignal<Match | null>(null);
  const [events, setEvents] = createSignal<MatchEvent[]>([]);
  const [isBusy, setIsBusy] = createSignal(false);
  const [isDemoRunning, setIsDemoRunning] = createSignal(false);

  const [results, setResults] = createSignal<Record<string, ScenarioResult>>(
    {},
  );
  const [logs, setLogs] = createSignal<LogEntry[]>([]);

  let simulated: SimulatedMatch | null = null;
  let demoTimeoutRef: ReturnType<typeof setTimeout> | undefined;
  let logId = 0;

  const playerNames = createMemo(
    () => new Map(players().map((player) => [player.uuid, player.name])),
  );

  const playerOptions = () =>
    players().map((player) => ({ label: player.name, value: player.uuid }));

  const tableOptions = () => [
    { label: 'No table', value: '' },
    ...tables().map((table) => ({ label: table.name, value: table.uuid })),
  ];

  const setup = () => ({
    tableUuid: tableUuid(),
    ballUuid: balls()[0]?.uuid ?? null,
    playersSide1: playersSide1(),
    playersSide2: playersSide2(),
  });

  const isSetupValid = () =>
    playersSide1().length > 0 &&
    playersSide2().length > 0 &&
    !playersSide1().some((uuid) => playersSide2().includes(uuid));

  const isLive = () =>
    match()?.status === 'ONGOING' || match()?.status === 'PAUSED';

  const addLog = (message: string, error = false) => {
    logId += 1;

    const entry = { id: logId, time: new Date(), message, error };

    setLogs((previous) => [entry, ...previous].slice(0, LOG_LIMIT));
  };

  const getRemoteOrThrow = (): CalculatorRemote => {
    const remote = api();

    if (remote === null) throw new Error('Not connected to host');

    return remote;
  };

  const getSimulated = (): SimulatedMatch => {
    simulated ??= createSimulatedMatch(getRemoteOrThrow(), setup(), {
      onChange: (current, currentEvents) => {
        setMatch(current);
        setEvents(currentEvents);
      },
    });

    return simulated;
  };

  const resetSimulated = () => {
    simulated = null;
    setMatch(null);
    setEvents([]);
  };

  const runStep = async (label: string, step: () => Promise<unknown>) => {
    if (isBusy()) return;

    setIsBusy(true);

    try {
      await step();

      addLog(`${label}: ok`);
    } catch (err) {
      addLog(`${label}: ${getErrorMessage(err)}`, true);
    } finally {
      setIsBusy(false);
    }
  };

  const loadReferenceData = async (remote: CalculatorRemote) => {
    const [loadedTables, loadedPlayers, loadedBalls] = await Promise.all([
      remote.getTables(),
      remote.getPlayers(),
      remote.getBalls(),
    ]);

    setTables(loadedTables);
    setPlayers(loadedPlayers);
    setBalls(loadedBalls);

    setTableUuid(loadedTables[0]?.uuid ?? null);
    setPlayersSide1(loadedPlayers.slice(0, 2).map((player) => player.uuid));
    setPlayersSide2(loadedPlayers.slice(2, 4).map((player) => player.uuid));

    addLog(
      `Loaded ${loadedTables.length} tables, ${loadedPlayers.length} players, ${loadedBalls.length} balls`,
    );
  };

  const startMatch = () =>
    runStep('Start match', async () => {
      if (match() !== null && match()?.status !== 'SCHEDULED') resetSimulated();

      await getSimulated().start();
    });

  const scheduleMatch = (offset: number) =>
    runStep('Schedule match', async () => {
      resetSimulated();

      await getSimulated().schedule(new Date(Date.now() + offset));
    });

  const resumeMatch = () =>
    runStep('Resume match', async () => {
      const remote = getRemoteOrThrow();
      const found = await remote.getMatches({
        filters: {
          status: ['ONGOING', 'PAUSED'],
          tableUuid: tableUuid() ?? undefined,
        },
        sorting: { field: 'startDate', direction: 'desc' },
        pagination: { limit: 1, offset: 0 },
      });
      const live = found.data[0];

      if (live === undefined) throw new Error('No live match on this table');

      const timeline = await remote.getMatchTimeline(live.uuid);

      setPlayersSide1(live.playersSide1);
      setPlayersSide2(live.playersSide2);
      resetSimulated();
      getSimulated().attach(timeline.match, timeline.events);
    });

  const loadRematch = () =>
    runStep('Load rematch lineup', async () => {
      const latest = await getRemoteOrThrow().getMatches({
        filters: {
          status: ['FINISHED', 'SURRENDERED'],
          tableUuid: tableUuid() ?? undefined,
        },
        sorting: { field: 'startDate', direction: 'desc' },
        pagination: { limit: 1, offset: 0 },
      });
      const last = latest.data[0];

      if (last === undefined)
        throw new Error('No finished match on this table');

      setPlayersSide1(last.playersSide1);
      setPlayersSide2(last.playersSide2);
      resetSimulated();
    });

  const loadPreview = () =>
    runStep('Load preview', async () => {
      const preview = await getRemoteOrThrow().getMatchPreview({
        playersSide1: playersSide1(),
        playersSide2: playersSide2(),
      });
      const { wins, draws, losses } = preview.headToHead;

      addLog(
        `Preview: h2h ${wins}W ${draws}D ${losses}L, goal share ${preview.prediction?.goalShare.toFixed(3) ?? '-'}`,
      );
    });

  const stopDemo = () => {
    clearTimeout(demoTimeoutRef);
    demoTimeoutRef = undefined;
    setIsDemoRunning(false);
  };

  const playDemoGoal = async () => {
    const current = match();

    if (current === null || current.status !== 'ONGOING') {
      stopDemo();

      return;
    }

    const side: MatchSide = Math.random() < 0.5 ? 'SIDE_1' : 'SIDE_2';
    const updated = await getSimulated().goal(side);
    const leader = Math.max(updated.side1Score, updated.side2Score);
    const lead = Math.abs(updated.side1Score - updated.side2Score);

    if (leader >= DEMO_TARGET_SCORE && lead >= 2) {
      await getSimulated().finish();
      addLog('Demo match finished');
      stopDemo();

      return;
    }

    demoTimeoutRef = setTimeout(() => {
      playDemoGoal().catch((err) => {
        addLog(`Demo: ${getErrorMessage(err)}`, true);
        stopDemo();
      });
    }, DEMO_GOAL_INTERVAL_MS);
  };

  const startDemo = () =>
    runStep('Start live demo', async () => {
      if (match()?.status !== 'ONGOING') {
        resetSimulated();
        await getSimulated().start();
      }

      setIsDemoRunning(true);
      demoTimeoutRef = setTimeout(() => {
        playDemoGoal().catch((err) => {
          addLog(`Demo: ${getErrorMessage(err)}`, true);
          stopDemo();
        });
      }, DEMO_GOAL_INTERVAL_MS);
    });

  const setResult = (key: string, result: ScenarioResult) => {
    setResults((previous) => ({ ...previous, [key]: result }));
  };

  const runScenario = async (scenario: CalculatorScenario) => {
    const remote = getRemoteOrThrow();
    const tracked: SimulatedMatch[] = [];
    const startedAt = Date.now();

    setResult(scenario.key, {
      state: ScenarioStateEnum.RUNNING,
      message: null,
      duration: null,
    });

    try {
      await scenario.run({
        api: remote,
        setup: setup(),
        log: (message) => addLog(`[${scenario.name}] ${message}`),
        track: (simulatedMatch) => {
          tracked.push(simulatedMatch);

          return simulatedMatch;
        },
      });

      setResult(scenario.key, {
        state: ScenarioStateEnum.PASSED,
        message: null,
        duration: Date.now() - startedAt,
      });
      addLog(`[${scenario.name}] passed`);
    } catch (err) {
      setResult(scenario.key, {
        state: ScenarioStateEnum.FAILED,
        message: getErrorMessage(err),
        duration: Date.now() - startedAt,
      });
      addLog(`[${scenario.name}] ${getErrorMessage(err)}`, true);
    } finally {
      for (const simulatedMatch of tracked) {
        await simulatedMatch.remove().catch((err) => {
          addLog(`[${scenario.name}] cleanup: ${getErrorMessage(err)}`, true);
        });
      }
    }
  };

  const runAllScenarios = async () => {
    if (isBusy()) return;

    setIsBusy(true);

    for (const scenario of CalculatorScenarios) {
      await runScenario(scenario);
    }

    setIsBusy(false);
  };

  const runSingleScenario = async (scenario: CalculatorScenario) => {
    if (isBusy()) return;

    setIsBusy(true);
    await runScenario(scenario);
    setIsBusy(false);
  };

  const passedCount = () =>
    Object.values(results()).filter(
      (result) => result.state === ScenarioStateEnum.PASSED,
    ).length;

  const formatPlayers = (uuids: readonly string[]) =>
    uuids.map((uuid) => playerNames().get(uuid) ?? uuid.slice(0, 8)).join(' ');

  const formatEvent = (event: MatchEvent) => {
    switch (event.type) {
      case 'GOAL':
        return `${event.ownGoal ? 'Own goal' : 'Goal'} ${playerNames().get(event.player) ?? ''}`;
      case 'POSITION_CHANGE':
      case 'SURRENDER':
        return `${event.type} ${event.side}`;
      default:
        return event.type;
    }
  };

  onMount(() => {
    if (window.parent === window) {
      setConnection(ConnectionStateEnum.STANDALONE);

      return;
    }

    let messenger: WindowMessenger | undefined;
    let hostConnection: Connection<CalculatorApi> | undefined;
    let retryTimeoutRef: ReturnType<typeof setTimeout> | undefined;

    const connectToHost = async () => {
      hostConnection?.destroy();
      messenger?.destroy();

      messenger = new WindowMessenger({
        remoteWindow: window.parent,
        allowedOrigins: [window.location.origin],
      });

      const current = connect<CalculatorApi>({ messenger, methods: {} });

      hostConnection = current;
      retryTimeoutRef = setTimeout(connectToHost, HOST_CONNECT_RETRY_MS);

      try {
        const remote: RemoteProxy<CalculatorApi> = await current.promise;

        clearTimeout(retryTimeoutRef);
        setApi(() => remote);
        setConnection(ConnectionStateEnum.CONNECTED);
        await loadReferenceData(remote);
      } catch (err) {
        if (hostConnection !== current) return;

        clearTimeout(retryTimeoutRef);
        setConnection(ConnectionStateEnum.FAILED);
        addLog(`Connection: ${getErrorMessage(err)}`, true);
      }
    };

    onCleanup(() => {
      clearTimeout(retryTimeoutRef);
      hostConnection?.destroy();
      messenger?.destroy();
    });

    connectToHost();
  });

  onCleanup(() => {
    if (isServer) return;

    clearTimeout(demoTimeoutRef);
  });

  return (
    <div class={style.container}>
      <Widget
        class={style.widget}
        topLeftLabels="Calculator Simulator"
        topRightLabels={<span>{ConnectionStateLabels[connection()]}</span>}
      >
        <div class={style.setup}>
          <span>Table:</span>
          <Dropdown
            ariaLabel="Table"
            options={tableOptions()}
            value={tableUuid() ?? ''}
            onChange={(value) => setTableUuid(value === '' ? null : value)}
          />

          <span>Side 1:</span>
          <Dropdown
            ariaLabel="Side 1 players"
            multiple
            searchable
            options={playerOptions()}
            value={playersSide1()}
            onChange={setPlayersSide1}
          />

          <span>Side 2:</span>
          <Dropdown
            ariaLabel="Side 2 players"
            multiple
            searchable
            options={playerOptions()}
            value={playersSide2()}
            onChange={setPlayersSide2}
          />
        </div>
      </Widget>

      <div class={style.columns}>
        <Widget class={style.widget} topLeftLabels="Manual Match">
          <div class={style.buttons}>
            <Button
              disabled={!isSetupValid() || isBusy() || isLive()}
              onClick={startMatch}
            >
              Start
            </Button>
            <Button
              severity="secondary"
              disabled={!isSetupValid() || isBusy()}
              onClick={() => scheduleMatch(2 * 60 * 60_000)}
            >
              Schedule +2h
            </Button>
            <Button
              severity="secondary"
              disabled={!isSetupValid() || isBusy()}
              onClick={() => scheduleMatch(DAY_MS)}
            >
              Schedule +1d
            </Button>
            <Button
              severity="secondary"
              disabled={isBusy() || api() === null}
              onClick={resumeMatch}
            >
              Resume
            </Button>
            <Button
              severity="secondary"
              disabled={isBusy() || api() === null}
              onClick={loadRematch}
            >
              Rematch
            </Button>
            <Button
              severity="secondary"
              disabled={!isSetupValid() || isBusy()}
              onClick={loadPreview}
            >
              Preview
            </Button>
          </div>

          <Divider class={style.dashedDivider} />

          <div class={style.buttons}>
            <Button
              disabled={match()?.status !== 'ONGOING' || isBusy()}
              onClick={() =>
                runStep('Goal side 1', () => getSimulated().goal('SIDE_1'))
              }
            >
              Goal 1
            </Button>
            <Button
              disabled={match()?.status !== 'ONGOING' || isBusy()}
              onClick={() =>
                runStep('Goal side 2', () => getSimulated().goal('SIDE_2'))
              }
            >
              Goal 2
            </Button>
            <Button
              severity="secondary"
              disabled={match()?.status !== 'ONGOING' || isBusy()}
              onClick={() =>
                runStep('Own goal side 1', () =>
                  getSimulated().goal('SIDE_1', { ownGoal: true }),
                )
              }
            >
              Own goal 1
            </Button>
            <Button
              severity="secondary"
              disabled={match()?.status !== 'ONGOING' || isBusy()}
              onClick={() =>
                runStep('Ball out', () => getSimulated().ballOut())
              }
            >
              Ball out
            </Button>
            <Show
              when={match()?.status === 'PAUSED'}
              fallback={
                <Button
                  severity="secondary"
                  disabled={match()?.status !== 'ONGOING' || isBusy()}
                  onClick={() =>
                    runStep('Pause', () => getSimulated().pause('Simulator'))
                  }
                >
                  Pause
                </Button>
              }
            >
              <Button
                severity="secondary"
                disabled={isBusy()}
                onClick={() => runStep('Resume', () => getSimulated().resume())}
              >
                Resume
              </Button>
            </Show>
            <Button
              severity="secondary"
              disabled={match()?.status !== 'ONGOING' || isBusy()}
              onClick={() =>
                runStep('Surrender side 1', () =>
                  getSimulated().surrender('SIDE_1'),
                )
              }
            >
              Surrender 1
            </Button>
            <Button
              severity="danger"
              disabled={!isLive() || isBusy()}
              onClick={() =>
                runStep('Cancel', () => getSimulated().cancel('Simulator'))
              }
            >
              Cancel
            </Button>
            <Button
              disabled={!isLive() || isBusy()}
              onClick={() => runStep('Finish', () => getSimulated().finish())}
            >
              Finish
            </Button>
            <Button
              severity="danger"
              disabled={match() === null || isBusy()}
              onClick={() =>
                runStep('Delete', async () => {
                  stopDemo();
                  await getSimulated().remove();
                  resetSimulated();
                })
              }
            >
              Delete
            </Button>
          </div>

          <Divider class={style.dashedDivider} />

          <div class={style.buttons}>
            <Show
              when={isDemoRunning()}
              fallback={
                <Button
                  disabled={
                    !isSetupValid() || isBusy() || match()?.status === 'PAUSED'
                  }
                  onClick={startDemo}
                >
                  {match()?.status === 'ONGOING'
                    ? 'Continue as live demo'
                    : 'Play live demo'}
                </Button>
              }
            >
              <Button severity="secondary" onClick={stopDemo}>
                Stop demo
              </Button>
            </Show>
          </div>

          <Show
            when={match()}
            fallback={<span class={style.noData}>No simulated match</span>}
          >
            {(current) => (
              <div class={style.state}>
                <span>Status:</span>
                <strong>{current().status}</strong>

                <span>Score:</span>
                <strong>
                  {current().side1Score}:{current().side2Score}
                </strong>

                <span>Side 1:</span>
                <strong>
                  {formatPlayers(getMatchSidePlayers(current(), 'SIDE_1'))}
                </strong>

                <span>Side 2:</span>
                <strong>
                  {formatPlayers(getMatchSidePlayers(current(), 'SIDE_2'))}
                </strong>

                <span>UUID:</span>
                <code>{current().uuid}</code>

                <span class={style.listLabel}>Events:</span>
                <div>
                  <For each={events()}>
                    {(event) => (
                      <div>
                        {formatElapsed(event.offset)} {formatEvent(event)}
                      </div>
                    )}
                  </For>
                </div>
              </div>
            )}
          </Show>
        </Widget>

        <Widget
          class={style.widget}
          topLeftLabels="Scenarios"
          topRightLabels={
            <span>
              {passedCount()}/{CalculatorScenarios.length} passed
            </span>
          }
          bottomLeftLabels={
            <Button
              disabled={!isSetupValid() || isBusy() || api() === null}
              onClick={runAllScenarios}
            >
              Run all
            </Button>
          }
        >
          <div class={style.scenarios}>
            <For each={CalculatorScenarios}>
              {(scenario) => {
                const result = () => results()[scenario.key];

                return (
                  <div class={style.scenario}>
                    <Button
                      severity="secondary"
                      padding={0}
                      disabled={!isSetupValid() || isBusy() || api() === null}
                      onClick={() => runSingleScenario(scenario)}
                    >
                      Run
                    </Button>
                    <span
                      classList={{
                        [style.passed]:
                          result()?.state === ScenarioStateEnum.PASSED,
                        [style.failed]:
                          result()?.state === ScenarioStateEnum.FAILED,
                        [style.running]:
                          result()?.state === ScenarioStateEnum.RUNNING,
                      }}
                    >
                      {result()?.state ?? ScenarioStateEnum.IDLE}
                    </span>
                    <span>
                      <strong>{scenario.name}</strong>{' '}
                      <span class={style.dimmed}>{scenario.description}</span>
                      <Show when={result()?.message}>
                        {(message) => (
                          <div class={style.failed}>{message()}</div>
                        )}
                      </Show>
                    </span>
                  </div>
                );
              }}
            </For>
          </div>
        </Widget>
      </div>

      <Widget class={style.widget} topLeftLabels="Log">
        <div class={style.log}>
          <For each={logs()}>
            {(entry) => (
              <div classList={{ [style.failed]: entry.error }}>
                <span class={style.dimmed}>
                  {entry.time.toLocaleTimeString()}
                </span>{' '}
                {entry.message}
              </div>
            )}
          </For>
        </div>
      </Widget>
    </div>
  );
};

export default CalculatorSimulatorTest;
