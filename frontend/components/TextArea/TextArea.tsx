import { type JSX, onMount } from 'solid-js';
import {
  applyDirectives,
  type ComponentUseDirectiveHack,
} from '#flib/solidHelpers';
import style from './TextArea.module.scss';

export interface TextAreaProps
  extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name?: string;
  placeholder?: string;

  invalid?: boolean;

  useDirectives?: ComponentUseDirectiveHack<HTMLInputElement>[];
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const TextArea: Component<TextAreaProps> = (props) => {
  let textareaRef!: HTMLTextAreaElement;

  onMount(() => {
    if (!textareaRef) return;

    // @ts-expect-error
    applyDirectives(textareaRef, props.useDirectives ?? []);
  });

  return (
    <textarea
      {...props}
      ref={(el) => {
        textareaRef = el;

        if (typeof props.ref === 'function') {
          props.ref(el);
        } else if (props.ref) {
          props.ref = el;
        }
      }}
      classList={{
        [style.textArea]: true,
        [style.invalid]: props.invalid,
        [props.class!]: !!props.class,
        ...(props.classList ?? {}),
      }}
      aria-invalid={props.invalid}
    />
  );
};
