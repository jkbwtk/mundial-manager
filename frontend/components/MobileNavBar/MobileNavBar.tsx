import { useLocation } from '@solidjs/router';
import {
  createEffect,
  createSignal,
  createUniqueId,
  type JSX,
  on,
  onCleanup,
  Show,
} from 'solid-js';
import { isServer } from 'solid-js/web';
import { Breadcrumbs } from '#components/Breadcrumbs';
import { AnchorButton, Button } from '#components/Button';
import { LogoSmall } from '#components/LogoSmall';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { useNotificationSettingsModal } from '#components/NotificationSettingsModal';
import { PermissionGuard } from '#components/PermissionGuard';
import { Sidebar, SidebarButton } from '#components/Sidebar';
import { Divider } from '#components/Widget';
import { useCan } from '#flib/identity';
import { routes } from '#frontend/routes';
import { MatchRecordingPermissions, PermissionEnum } from '#shared/permissions';
import style from './MobileNavBar.module.scss';

export interface MobileNavBarProps {
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const MobileNavBar: Component<MobileNavBarProps> = (props) => {
  const can = useCan();
  const location = useLocation();
  const openNotificationSettings = useNotificationSettingsModal();

  const id = createUniqueId();

  const [open, setOpen] = createSignal(false);

  const toggleMenu = () => setOpen((isOpen) => !isOpen);
  const closeMenu = () => setOpen(false);

  const handleOpenNotificationSettings = () => {
    closeMenu();
    openNotificationSettings();
  };

  createEffect(on(() => location.pathname, closeMenu, { defer: true }));

  createEffect(
    on(open, (isOpen) => {
      if (isServer || !isOpen) return;

      const handleKeyDown = (ev: KeyboardEvent) => {
        if (ev.key !== 'Escape') return;

        ev.preventDefault();
        closeMenu();
      };

      document.addEventListener('keydown', handleKeyDown);

      onCleanup(() => document.removeEventListener('keydown', handleKeyDown));
    }),
  );

  return (
    <>
      <header
        classList={{
          [style.container]: true,
          [props.class ?? '']: !!props.class,
          ...(props.classList ?? {}),
        }}
      >
        <div class={style.bar}>
          <Button
            type="button"
            severity="secondary"
            padding={0}
            aria-label="Menu"
            aria-expanded={open()}
            aria-controls={`${id}-drawer`}
            onClick={toggleMenu}
          >
            <MaterialSymbol symbol={open() ? 'close' : 'menu'} />
          </Button>

          <Breadcrumbs class={style.breadcrumbs} />

          <Show when={can(MatchRecordingPermissions)}>
            <AnchorButton
              href="/mundial-calculator"
              severity="secondary"
              padding={0}
              aria-label="Record match"
            >
              <span class={style.record}>+</span>
            </AnchorButton>
          </Show>
        </div>

        <Divider />
      </header>

      <div
        aria-hidden="true"
        classList={{
          [style.backdrop]: true,
          [style.open]: open(),
        }}
        onClick={closeMenu}
      />

      <aside
        id={`${id}-drawer`}
        classList={{
          [style.drawer]: true,
          [style.open]: open(),
        }}
      >
        <div class={style.logo}>
          <LogoSmall />
        </div>

        <Divider />

        <Sidebar routes={routes}>
          <PermissionGuard permission={PermissionEnum.MATCHES_READ}>
            <SidebarButton
              symbol="notifications"
              label="Notifications"
              onClick={handleOpenNotificationSettings}
            />
          </PermissionGuard>
        </Sidebar>
      </aside>
    </>
  );
};
