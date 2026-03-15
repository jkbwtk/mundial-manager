import { toSvg } from 'jdenticon';
import { type JSX, mergeProps } from 'solid-js';
import { useConsoleUnitPrototype } from '#providers/ConsoleUnitPrototypeProvider';
import { getValueHash, type RequiredDefaults } from '#shared/utils';
import style from './Identicon.module.scss';

export type IdenticonProps = {
  value: unknown;
  size?: number;
  backgroundColor?: string;

  class?: string;
  classList?: JSX.CustomAttributes<'span'>['classList'];
};

const defaultProps: RequiredDefaults<IdenticonProps> = {
  size: 3,
  backgroundColor: '#FFF',

  class: '',
  classList: {},
};

export const Identicon: Component<IdenticonProps> = (userProps) => {
  const [{ unit }] = useConsoleUnitPrototype();

  const props = mergeProps(defaultProps, userProps);

  const svg = () => {
    const hash = getValueHash(props.value);
    const baseSvg = toSvg(hash, 1024, { backColor: props.backgroundColor });

    return baseSvg
      .replace('height="1024"', `height="${unit.width * 2 * props.size}"`)
      .replace('width="1024"', `width="${unit.width * 2 * props.size}"`);
  };

  return (
    <span
      classList={{
        [style.container]: true,
        [props.class]: !!props.class,

        ...props.classList,
      }}
      style={{
        height: `${unit.height * props.size}px`,
      }}
      innerHTML={svg()}
    />
  );
};
