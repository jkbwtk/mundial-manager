import { useAction } from '@solidjs/router';
import { type Connection, connect, WindowMessenger } from 'penpal';
import { onCleanup, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';
import { MatchSaveConfirmModal } from '#components/MatchSaveConfirmModal';
import { convertCalculatorFinishEventToMatch } from '#flib/sheetUtils';
import {
  actionCreateMatch,
  actionCreateMatchEvent,
  actionDeleteMatch,
  actionDeleteMatchEvent,
  actionUpdateMatch,
  actionUpdateMatchEvent,
  queryBalls,
  queryPlayers,
  queryTables,
} from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import type {
  CalculatorApi,
  CalculatorFinishEvent,
} from '#shared/types/MundialCalculator';
import style from './MundialCalculator.module.scss';

const CALCULATOR_URL = import.meta.env.VITE_CALCULATOR_URL;

const MundialCalculator: Component = () => {
  const [, { open }] = useModal();
  const [, { info }] = useToast();

  let iframeRef!: HTMLIFrameElement;

  const openMatchModal = (data: CalculatorFinishEvent) => {
    open({
      props: {
        component: MatchSaveConfirmModal,
        match: convertCalculatorFinishEventToMatch(data),
      },
      closeOnBackgroundClick: false,
    });
  };

  const createMatch = useAction(actionCreateMatch);
  const updateMatch = useAction(actionUpdateMatch);
  const deleteMatch = useAction(actionDeleteMatch);

  const createEvent = useAction(actionCreateMatchEvent);
  const updateEvent = useAction(actionUpdateMatchEvent);
  const deleteEvent = useAction(actionDeleteMatchEvent);

  let messenger: WindowMessenger | undefined;
  let connection: Connection | undefined;

  onMount(async () => {
    messenger = new WindowMessenger({
      remoteWindow: iframeRef.contentWindow!,
      allowedOrigins: [new URL(iframeRef.src).origin],
    });

    connection = connect({
      messenger,
      log: (...args) => console.debug(...args),

      methods: {
        getTables: () => queryTables().then((r) => r.data),
        getBalls: () => queryBalls().then((r) => r.data),
        getPlayers: () => queryPlayers().then((r) => r.data),

        createLegacyMatch: (match) => openMatchModal(match),

        createMatch,
        updateMatch,
        deleteMatch,

        createEvent,
        updateEvent,
        deleteEvent,
      } satisfies CalculatorApi,
    });

    await connection.promise;

    info('Connection with calculator successful', {
      duration: 1000,
    });
  });

  onCleanup(() => {
    if (isServer === false) {
      connection?.destroy();
      messenger?.destroy();
    }
  });

  return (
    <iframe
      ref={iframeRef}
      src={CALCULATOR_URL}
      title="Mundial Calculator"
      class={style.iframe}
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  );
};

export default MundialCalculator;
