import { createSignal } from 'solid-js';
import { Divider, Widget } from '#components/Widget';
import style from './IframeTest.module.scss';

const IframeTest: Component = () => {
  const [url] = createSignal(import.meta.env.VITE_CALCULATOR_URL);

  return (
    <Widget topLeftLabels="Iframe Test Page" class={style.container}>
      <div class={style.controls}>
        <strong>URL:</strong> <code>{url()}</code>
      </div>
      <Divider />
      <iframe
        src={url()}
        title="Test Iframe"
        class={style.iframe}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </Widget>
  );
};

export default IframeTest;
