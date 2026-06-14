import type { JSX } from 'solid-js';
import type { ComponentUseDirectiveHack } from '#flib/solidHelpers';
import style from './TextArea.module.scss';

export interface TextAreaProps extends JSX.HTMLAttributes<HTMLTextAreaElement> {
  name?: string;
  placeholder?: string;

  useDirectives?: ComponentUseDirectiveHack<HTMLInputElement>[];
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const TextArea: Component<TextAreaProps> = (props) => {
  return (
    <textarea
      {...props}
      classList={{
        [style.textArea]: true,
        [props.class!]: !!props.class,
        ...(props.classList ?? {}),
      }}
    />
  );
};
