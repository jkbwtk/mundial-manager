import { createMemo, mergeProps } from 'solid-js';
import { AnimatedText } from '#components/AnimatedText';
import { getSizeWithUnit } from '#lib/fileUtils';
import type { RequiredDefaults } from '#lib/utils';

export type FileSizeWithUnitProps = {
  size: number;
  precision?: number;
};

const defaultProps: RequiredDefaults<FileSizeWithUnitProps> = {
  precision: 2,
};

export const FileSizeWithUnit: Component<FileSizeWithUnitProps> = (
  unmergedProps,
) => {
  const props = mergeProps(defaultProps, unmergedProps);

  const converted = createMemo(() => {
    const { size, unit } = getSizeWithUnit(props.size);

    return `${size.toFixed(props.precision)} ${unit}`;
  });

  return <AnimatedText>{converted()}</AnimatedText>;
};
