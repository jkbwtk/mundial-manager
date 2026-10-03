import { Show } from 'solid-js';
import { ColorBlock } from '#components/ColorBlock';
import type { Ball } from '#shared/types/api/ball';

export interface BallLabelProps {
  ball: Ball;
}

export const BallLabel: Component<BallLabelProps> = (props) => (
  <>
    {props.ball.name}
    <Show when={props.ball.color}>
      {(color) => (
        <>
          {' '}
          (<ColorBlock color={color()} width={2} />)
        </>
      )}
    </Show>
  </>
);
