import { ResourcePicker } from '#components/ResourcePicker';
import { querySearchTables } from '#flib/trpcCalls';
import style from './ResourcePickerTest.module.scss';

export const ResourcePickerTest: Component = () => {
  return (
    <div class={style.container}>
      <ResourcePicker
        query={querySearchTables}
        transform={(d) => d}
        toEntry={(e) => {
          return { label: e.name, value: e.uuid };
        }}
      />
    </div>
  );
};

export default ResourcePickerTest;
