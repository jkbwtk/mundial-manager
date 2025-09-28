import { mergeProps, onMount, type Setter } from 'solid-js';
import { customWidgetType } from '#components/Widget';
import { isDev } from '#flib/utils';
import type { RequiredDefaults } from '#shared/utils';
import style from './FilePicker.module.scss';

export type FilePickerProps = {
  accept?: string;
  setFile: Setter<File | undefined>;
  class?: string;
};

const LabelWidget = customWidgetType('label');

const defaultProps: RequiredDefaults<FilePickerProps> = {
  accept: '*/*',
  class: '',
};

export const FilePicker: Component<FilePickerProps> = (unmergedProps) => {
  const props = mergeProps(defaultProps, unmergedProps);

  // biome-ignore lint/style/useConst: yeah
  let inputRef: HTMLInputElement = null!;

  function handleFileAfterReload() {
    if (inputRef.files && inputRef.files.length > 0) {
      props.setFile(inputRef.files[0]);
    }
  }

  function handleFileChange(event: Event) {
    if (event.target instanceof HTMLInputElement && event.target.files) {
      props.setFile(event.target.files[0]);
    }
  }

  function handleFileDrop(event: DragEvent) {
    event.preventDefault();

    props.setFile(event.dataTransfer?.files[0]);
  }

  onMount(() => {
    if (inputRef) {
      handleFileAfterReload();
    } else if (isDev()) {
      console.warn('FilePicker: inputRef is null');
    }
  });

  return (
    <LabelWidget
      topLeftLabels="File Picker"
      onDrop={handleFileDrop}
      classList={{
        [style.container]: true,
        [props.class]: true,
      }}
    >
      <input
        ref={inputRef}
        class={style.input}
        onChange={handleFileChange}
        type="file"
        accept={props.accept}
      />

      <div class={style.label}>
        <span>
          Click to pick a file <br /> or drop one here
        </span>
      </div>
    </LabelWidget>
  );
};
