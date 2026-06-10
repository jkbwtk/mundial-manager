import { Show } from 'solid-js';
import { ColorBlock } from '#components/ColorBlock';
import { ResourcePicker } from '#components/ResourcePicker';
import { queryBallById, queryBalls } from '#flib/trpcCalls';
import style from './ResourcePickerTest.module.scss';

export const ResourcePickerTest: Component = () => {
  return (
    <div class={style.container}>
      <ResourcePicker
        queryById={queryBallById}
        placeholder="Select a ball..."
        query={queryBalls}
        toEntry={(e) => {
          return {
            label: (
              <>
                {e.name}{' '}
                <Show when={e.color}>
                  {(color) => (
                    <>
                      (<ColorBlock color={color()} width={2} />)
                    </>
                  )}
                </Show>
              </>
            ),
            value: e.uuid,
          };
        }}
      />
    </div>
  );
};

export default ResourcePickerTest;
