import { For, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { isServer } from 'solid-js/web';
import { AnimatedText } from '#components/AnimatedText';
import { Button } from '#components/Button';
import { Divider } from '#components/Widget';
import { useToastActions } from '#providers/ToastProvider';
import style from './PWATest.module.scss';

interface WorkerState {
  scriptUrl: string | null;
  state: string;
}

interface PWAState {
  workers: WorkerState[];
}

const PWATest: Component = () => {
  const toast = useToastActions();

  const [state, updateState] = createStore<PWAState>({
    workers: [],
  });

  const getServiceWorkerState = async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();

    updateState('workers', []);

    for (const registration of registrations) {
      const workerState: WorkerState = {
        scriptUrl: registration?.active?.scriptURL || null,
        state: registration?.active?.state || 'N/A',
      };

      updateState('workers', (workers) => [...workers, workerState]);
    }
  };

  const unregisterServiceWorkers = async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      await registration.unregister();
    }

    toast.success('All service workers unregistered, refreshing in 5 seconds', {
      dismissible: false,
    });

    setTimeout(() => {
      window.location.reload();
    }, 5000);
  };

  onMount(() => {
    if (isServer === false) {
      getServiceWorkerState();
    }
  });

  return (
    <div class={style.container}>
      <For each={state.workers}>
        {(worker) => (
          <>
            <br />
            Script URL: <AnimatedText>{worker.scriptUrl ?? 'N/A'}</AnimatedText>
            <br />
            State: <AnimatedText>{worker.state || 'N/A'}</AnimatedText>
          </>
        )}
      </For>
      <Divider />
      <Button onClick={getServiceWorkerState}>
        Refresh Service Worker State
      </Button>{' '}
      <Button severity="danger" onClick={unregisterServiceWorkers}>
        Unregister All Service Workers
      </Button>
    </div>
  );
};

export default PWATest;
