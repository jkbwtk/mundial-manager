import { createSignal } from 'solid-js';
import { Button } from '#components/Button';
import { Input } from '#components/Input';
import { Divider } from '#components/Widget';
import { useToast } from '#providers/ToastProvider';
import style from './ToastTest.module.scss';

const ToastTest: Component = () => {
  const [state, actions] = useToast();
  const [maxVisible, setMaxVisible] = createSignal(state.config.maxVisible);

  const showInfo = () => {
    actions.info('This is an informational message');
  };

  const showSuccess = () => {
    actions.success('Operation completed successfully');
  };

  const showWarning = () => {
    actions.warning('This action may have consequences');
  };

  const showError = () => {
    actions.error('An error occurred while processing');
  };

  const showWithAction = () => {
    actions.show({
      message: 'File saved. View changes?',
      severity: 'success',
      actions: [
        {
          label: 'View',
          severity: 'secondary',
          onClick: () => actions.info('Opening file viewer...'),
        },
      ],
    });
  };

  const showWithMultipleActions = () => {
    actions.show({
      message: 'Changes detected. What would you like to do?',
      severity: 'warning',
      duration: null,
      actions: [
        {
          label: 'Review',
          severity: 'primary',
          onClick: () => actions.info('Opening review panel...'),
        },
        {
          label: 'Ignore',
          severity: 'secondary',
          onClick: () => actions.info('Changes ignored'),
        },
      ],
    });
  };

  const showWithOverflowingActions = () => {
    actions.show({
      message: 'Multiple toast actions available. Choose one:',
      severity: 'info',
      duration: null,
      actions: Array.from({ length: 10 }, (_, i) => ({
        label: `Action ${i + 1}`,
        severity: 'secondary' as const,
        onClick: () => actions.info(`Action ${i + 1} selected`),
      })),
    });
  };

  const showPersistent = () => {
    actions.show({
      message: 'Persistent toast (always visible)',
      severity: 'warning',
      duration: null,
    });
  };

  const showNonDismissible = () => {
    actions.show({
      message: 'Processing... please wait',
      severity: 'info',
      dismissible: false,
      duration: 3000,
    });
  };

  const showLongMessage = () => {
    actions.info(
      'This is a very long message that demonstrates text truncation behavior',
    );
  };

  const showMultiple = () => {
    for (let i = 1; i <= 8; i++) {
      setTimeout(
        () => {
          const severities = ['info', 'success', 'warning', 'error'] as const;
          const severity = severities[(i - 1) % 4];
          actions.show({
            message: `Notification #${i}`,
            severity,
          });
        },
        (i - 1) * 150,
      );
    }
  };

  const updateMaxVisible = (value: string) => {
    const num = Number.parseInt(value, 10);
    if (!Number.isNaN(num) && num > 0) {
      setMaxVisible(num);
    }
  };

  return (
    <div class={style.container}>
      Basic toasts (hover to pause countdown):
      <br />
      <Button onClick={showInfo}>Info</Button>{' '}
      <Button onClick={showSuccess}>Success</Button>{' '}
      <Button onClick={showWarning}>Warning</Button>{' '}
      <Button severity="danger" onClick={showError}>
        Error
      </Button>
      <Divider />
      Toast with action:
      <br />
      <Button onClick={showWithAction}>With Action</Button>{' '}
      <Button onClick={showWithMultipleActions}>With Multiple Actions</Button>{' '}
      <Button onClick={showWithOverflowingActions}>
        With Overflowing Actions
      </Button>
      <Divider />
      Special toasts:
      <br />
      <Button onClick={showPersistent}>Persistent</Button>{' '}
      <Button onClick={showNonDismissible}>Non-dismissible (3s)</Button>
      <Divider />
      Long message:
      <br />
      <Button onClick={showLongMessage}>Long Message</Button>
      <Divider />
      Queue test (spawns 8 toasts):
      <br />
      <Button onClick={showMultiple}>Show Multiple</Button>{' '}
      <Button severity="secondary" onClick={actions.dismissAll}>
        Dismiss All
      </Button>
      <Divider />
      Configuration:
      <br />
      Max visible:{' '}
      <Input
        type="number"
        value={maxVisible()}
        onInput={(e) => updateMaxVisible(e.currentTarget.value)}
        style={{ width: '4ch' }}
      />{' '}
      (current queue: {state.toasts.filter((t) => !t.isLeaving).length})
    </div>
  );
};

export default ToastTest;
