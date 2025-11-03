import { For, Show } from 'solid-js';
import { Break } from '#components/Break';
import { Button } from '#components/Button';
import { VersionChangelog } from '#components/ChangelogModal/VersionChangelog';
import { Modal } from '#components/Modal';
import { Divider } from '#components/Widget';
import { useChangelogContext } from '#providers/ChangelogProvider';
import { useModalActions } from '#providers/ModalProvider';
import style from './ChangelogModal.module.scss';

export const ChangelogModal: Component = () => {
  const { closeModal } = useModalActions();
  const [state, { disablePermanently, disableUntilNextVersion }] =
    useChangelogContext();

  return (
    <Modal
      topLeftLabels="Changelog"
      bottomLeftLabels={[
        <Button
          severity="secondary"
          onPointerUp={() => {
            disableUntilNextVersion();
            closeModal();
          }}
        >
          Dismiss
        </Button>,
        <Button
          severity="danger"
          onPointerUp={() => {
            disablePermanently();
            closeModal();
          }}
        >
          Disable
        </Button>,
      ]}
      class={style.changelogModal}
    >
      <div class={style.content}>
        <Show
          when={state.valid && state.changelog.versions.length > 0}
          fallback={<div class={style.noChangelog}>No changelog available</div>}
        >
          <For each={state.changelog.versions}>
            {(version) => (
              <>
                {' '}
                <VersionChangelog version={version} />
                <Show when={version !== state.changelog.versions.at(-1)}>
                  <Divider class={style.changelogDivider} />
                  <Break />
                </Show>
              </>
            )}
          </For>
        </Show>
      </div>
    </Modal>
  );
};
