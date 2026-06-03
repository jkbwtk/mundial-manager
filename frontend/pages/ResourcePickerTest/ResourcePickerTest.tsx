import { ResourcePicker } from '#components/ResourcePicker';
import { queryTables } from '#flib/trpcCalls';
import style from './ResourcePickerTest.module.scss';

export const ResourcePickerTest: Component = () => {
  return (
    <div class={style.container}>
      <ResourcePicker
        query={queryTables}
        transform={(d) => d.data}
        toEntry={(e) => {
          return { label: e.name, value: e.uuid };
        }}
      />
    </div>
  );
};

export default ResourcePickerTest;
