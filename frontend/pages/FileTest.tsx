import { createMemo, createSignal, Show } from 'solid-js';
import { AnimatedText } from '#components/AnimatedText';
import { FilePicker } from '#components/FilePicker';
import { FreeSpaceGauge } from '#components/FreeSpaceGauge';
import { Widget } from '#components/Widget';
import { useFilesystem } from '#providers/FilesystemProvider';
import style from '#styles/FileTest.module.scss';

const FileTest: Component = () => {
  const [state] = useFilesystem();
  const [file, setFile] = createSignal<File | undefined>(undefined);
  const imageData = createMemo(() => {
    const fileSnapshot = file();

    if (!fileSnapshot) {
      return undefined;
    }

    return URL.createObjectURL(fileSnapshot);
  });

  return (
    <div>
      FILE TEST
      <div>
        FILESYSTEM INITIALIZED: <AnimatedText>{state.ready}</AnimatedText>
      </div>
      <FreeSpaceGauge />
      <FilePicker class={style.filePicker} setFile={setFile} accept="image/*" />
      <Show when={imageData()}>
        <Widget
          title="File Preview"
          class={style.previewContainer}
          subtitle={file()?.name}
        >
          <img src={imageData()} alt="TEST" class={style.preview} />
        </Widget>
      </Show>
    </div>
  );
};

export default FileTest;
