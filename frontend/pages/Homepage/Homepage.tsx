import { A } from '@solidjs/router';
import figlet from 'figlet';
import smallSlant from 'figlet/fonts/Small Slant';
import {
  For,
  Match,
  Switch,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import { isServer } from 'solid-js/web';
import { Break } from '#components/Break';
import { Divider, Widget } from '#components/Widget';
import { useConsoleUnitPrototype } from '#providers/ConsoleUnitPrototypeProvider';
import { useSheets } from '#providers/SheetsProvider';
import style from './Homepage.module.scss';

figlet.parseFont('Small Slant', smallSlant);

const Homepage: Component = () => {
  const [{ unit: consoleUnit }] = useConsoleUnitPrototype();
  const [, { eloStats }] = useSheets();

  const [pageWidth, setPageWidth] = createSignal(120);

  const handleResize = () => {
    setPageWidth(Math.floor(window.innerWidth / consoleUnit.width));
  };

  onMount(() => {
    if (isServer === false) {
      window.addEventListener('resize', handleResize);
      handleResize();
    }
  });

  onCleanup(() => {
    if (isServer === false) {
      window.removeEventListener('resize', handleResize);
    }
  });

  const logo = () =>
    figlet.textSync('Mundial Manager', {
      font: 'Small Slant',
      width: pageWidth(),
      whitespaceBreak: true,
    });

  const sortedElos = createMemo(() => ({
    playerElos: Object.fromEntries(
      Object.entries(eloStats().playerElos).sort((a, b) => b[1] - a[1]),
    ),
    teamElos: Object.fromEntries(
      Object.entries(eloStats().teamElos).sort((a, b) => b[1] - a[1]),
    ),
    hybridElos: Object.fromEntries(
      Object.entries(eloStats().hybridElos).sort((a, b) => b[1] - a[1]),
    ),
  }));

  return (
    <div class={style.container}>
      <strong>
        <pre class={style.logo}>{logo()}</pre>
      </strong>

      <div>Still in development</div>
      <div>
        Test pages are available <A href="/tests">here</A>
      </div>

      <Break />

      <Widget title="Elo Stats" class={style.eloStats}>
        <div class={style.header}>
          <strong>Player Stats</strong>
        </div>

        <div class={style.list}>
          <For each={Object.entries(sortedElos().playerElos)}>
            {([player, elo], index) => (
              <>
                <span>{index() + 1}.</span>
                <span> {player}</span>
                <span>{elo.toFixed(2)}</span>

                <span
                  classList={{
                    [style.positive]:
                      (eloStats().playerElosChange[player] ?? 0) > 0,
                    [style.negative]:
                      (eloStats().playerElosChange[player] ?? 0) < 0,
                  }}
                >
                  <Switch>
                    <Match when={eloStats().playerElosChange[player] === 0}>
                      =
                    </Match>
                    <Match
                      when={(eloStats().playerElosChange[player] ?? 0) > 0}
                    >
                      ↑
                    </Match>
                    <Match
                      when={(eloStats().playerElosChange[player] ?? 0) < 0}
                    >
                      ↓
                    </Match>
                  </Switch>

                  {Math.abs(eloStats().playerElosChange[player] ?? 0).toFixed(
                    2,
                  )}
                </span>
              </>
            )}
          </For>
        </div>

        <Divider />

        <div class={style.header}>
          <strong>Hybrid Stats</strong>
        </div>

        <div class={style.list}>
          <For each={Object.entries(sortedElos().hybridElos)}>
            {([player, elo], index) => (
              <>
                <span>{index() + 1}.</span>
                <span> {player}</span>
                <span>{elo.toFixed(2)}</span>

                <span
                  classList={{
                    [style.positive]:
                      (eloStats().hybridElosChange[player] ?? 0) > 0,
                    [style.negative]:
                      (eloStats().hybridElosChange[player] ?? 0) < 0,
                  }}
                >
                  <Switch>
                    <Match when={eloStats().hybridElosChange[player] === 0}>
                      =
                    </Match>
                    <Match
                      when={(eloStats().hybridElosChange[player] ?? 0) > 0}
                    >
                      ↑
                    </Match>
                    <Match
                      when={(eloStats().hybridElosChange[player] ?? 0) < 0}
                    >
                      ↓
                    </Match>
                  </Switch>

                  {Math.abs(eloStats().hybridElosChange[player] ?? 0).toFixed(
                    2,
                  )}
                </span>
              </>
            )}
          </For>
        </div>

        <Divider />

        <div class={style.header}>
          <strong>Team Stats</strong>
        </div>

        <div class={style.list}>
          <For each={Object.entries(sortedElos().teamElos)}>
            {([team, elo], index) => (
              <>
                <span>{index() + 1}.</span>
                <span> {team}</span>
                <span>{elo.toFixed(2)}</span>

                <span
                  classList={{
                    [style.positive]:
                      (eloStats().teamElosChange[team] ?? 0) > 0,
                    [style.negative]:
                      (eloStats().teamElosChange[team] ?? 0) < 0,
                  }}
                >
                  <Switch>
                    <Match when={eloStats().teamElosChange[team] === 0}>
                      =
                    </Match>
                    <Match when={(eloStats().teamElosChange[team] ?? 0) > 0}>
                      ↑
                    </Match>
                    <Match when={(eloStats().teamElosChange[team] ?? 0) < 0}>
                      ↓
                    </Match>
                  </Switch>

                  {Math.abs(eloStats().teamElosChange[team] ?? 0).toFixed(2)}
                </span>
              </>
            )}
          </For>
        </div>
      </Widget>
    </div>
  );
};

export default Homepage;
