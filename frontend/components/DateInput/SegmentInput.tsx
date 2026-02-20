import { splitProps, untrack } from 'solid-js';

export interface SegmentProps {
  ref: (el: HTMLInputElement) => void;
  class: string;
  maxlength: number;
  placeholder: string;
  defaultValue: string;
  label: string;
  disabled: boolean;
  keys: (e: KeyboardEvent) => void;
  blurClamp?: (val: string) => string;
  onEmit: () => void;
}

export const SegmentInput: Component<SegmentProps> = (userProps) => {
  const [props, htmlProps] = splitProps(userProps, [
    'ref',
    'keys',
    'blurClamp',
    'onEmit',
    'defaultValue',
  ]);

  return (
    <input
      {...htmlProps}
      ref={props.ref}
      type="text"
      inputmode="numeric"
      value={untrack(() => props.defaultValue)}
      onKeyDown={props.keys}
      onInput={(e) => {
        e.currentTarget.value = e.currentTarget.value
          .replace(/\D/g, '')
          .slice(0, htmlProps.maxlength);
        props.onEmit();
      }}
      onBlur={(e) => {
        if (!props.blurClamp) return;
        const clamped = props.blurClamp(e.currentTarget.value);
        if (clamped) {
          e.currentTarget.value = clamped;
          props.onEmit();
        }
      }}
    />
  );
};
