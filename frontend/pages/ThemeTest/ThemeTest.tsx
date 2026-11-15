import { createSignal, For, getOwner, Show } from 'solid-js';
import { Button } from '#components/Button';
import { ButtonGroup, type ButtonGroupOption } from '#components/ButtonGroup';
import { Dropdown } from '#components/Dropdown';
import { FormErrors } from '#components/FormErrors';
import { Input } from '#components/Input';
import { Modal } from '#components/Modal';
import { ThemePicker } from '#components/ThemePicker';
import { Divider, Widget } from '#components/Widget';
import { THEME_DEFAULT_PHASE, ThemeDefinitions } from '#flib/themes';
import { useModal } from '#providers/ModalProvider';
import { useTheme } from '#providers/ThemeProvider';
import style from './ThemeTest.module.scss';

const THEME_TEST_AUTO_PHASE = 'auto';

const ThemeTestModal: Component = () => (
  <Modal class={style.modal} topLeftLabels="Theme Test Modal">
    Modal slot preview
  </Modal>
);

export const ThemeTest: Component = () => {
  const [state, { setProgressOverride, setPhaseOverride }] = useTheme();
  const [, { open }] = useModal();
  const owner = getOwner();

  const [option, setOption] = createSignal('a');

  const phases = () => ThemeDefinitions[state.theme].phases ?? [];

  const phaseOptions = (): ButtonGroupOption<string>[] => [
    { label: 'Auto', value: THEME_TEST_AUTO_PHASE },
    { label: 'Default', value: THEME_DEFAULT_PHASE },
    ...phases().map(({ name, hours: [start, end] }) => ({
      label: `${name} ${start}-${end}h`,
      value: name,
    })),
  ];

  const selectPhase = (phase: string) => {
    setPhaseOverride(phase === THEME_TEST_AUTO_PHASE ? null : phase);
  };

  const openModal = () => {
    open({
      props: { component: ThemeTestModal },
      owner,
      closeOnBackgroundClick: true,
    });
  };

  return (
    <div class={style.container}>
      <Widget class={style.widget} topLeftLabels="Theme">
        <ThemePicker />

        <Divider />

        <div>
          Active: {ThemeDefinitions[state.theme].label} (preference{' '}
          {state.preference}, decorations{' '}
          {state.decorations !== null ? 'loaded' : 'not loaded'})
        </div>

        <For each={Object.values(ThemeDefinitions)}>
          {(definition) => (
            <div class={style.dim}>
              {definition.label}:{' '}
              <Show when={definition.window} fallback="always available">
                {(window) =>
                  `${window().start.join('/')} → ${window().end.join('/')}`
                }
              </Show>
            </div>
          )}
        </For>
      </Widget>

      <Widget class={style.widget} topLeftLabels="Season">
        <div class={style.row}>
          Season progress {Math.round(state.progress * 100)}%
          <Show when={state.progressOverride !== null}> (overridden)</Show>
        </div>

        <div class={style.row}>
          <Input
            type="range"
            min="0"
            max="100"
            value={Math.round(state.progress * 100)}
            aria-label="Season progress override"
            onInput={(ev) =>
              setProgressOverride(Number(ev.currentTarget.value) / 100)
            }
          />{' '}
          <Button padding={0} onClick={() => setProgressOverride(null)}>
            Reset
          </Button>
        </div>
      </Widget>

      <Widget class={style.widget} topLeftLabels="Phase">
        <Show
          when={phases().length > 0}
          fallback={<span class={style.dim}>No phases for this theme</span>}
        >
          <div class={style.row}>
            Phase {state.phase ?? THEME_DEFAULT_PHASE}
            <Show when={state.phaseOverride !== null}> (overridden)</Show>
          </div>

          <div class={style.row}>
            <ButtonGroup
              options={phaseOptions()}
              value={state.phaseOverride ?? THEME_TEST_AUTO_PHASE}
              onChange={selectPhase}
              ariaLabel="Phase override"
            />
          </div>
        </Show>
      </Widget>

      <Widget class={style.widget} topLeftLabels="Primitives">
        <div class={style.row}>
          <Button>Primary</Button> <Button severity="danger">Danger</Button>{' '}
          <Button disabled>Disabled</Button>{' '}
          <Button onClick={openModal}>Open modal</Button>
        </div>
        <div class={style.row}>
          <Dropdown
            options={[
              { label: 'First option', value: 'a' },
              { label: 'Second option', value: 'b' },
            ]}
            value={option()}
            onChange={setOption}
            ariaLabel="Glyph preview"
          />{' '}
          <Input placeholder="Input preview" />
        </div>
        <FormErrors errors={{ preview: ['Error bullet preview'] }} />
        <code>code token</code> <a href="/">Homepage link</a>
      </Widget>
    </div>
  );
};

export default ThemeTest;
