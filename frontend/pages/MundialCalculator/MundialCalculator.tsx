import { useCalculatorHost } from '#flib/calculatorHost';
import { createResilientAsync } from '#flib/resilientAsync';
import { queryCalculatorUrl } from '#flib/trpcCalls';
import { useToast } from '#providers/ToastProvider';
import style from './MundialCalculator.module.scss';

const MundialCalculator: Component = () => {
  const [, actions] = useToast();

  const calculatorUrl = createResilientAsync(queryCalculatorUrl);

  let iframeRef!: HTMLIFrameElement;

  useCalculatorHost({
    iframe: () => iframeRef,
    onConnect: () =>
      actions.info('Connection with calculator successful', {
        duration: 1000,
      }),
    onConnectError: (err) => {
      console.error('Calculator connection error:', err);
      actions.error('Failed to connect to the calculator');
    },
  });

  return (
    <iframe
      ref={iframeRef}
      src={calculatorUrl.latest}
      title="Mundial Calculator"
      class={style.iframe}
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  );
};

export default MundialCalculator;
