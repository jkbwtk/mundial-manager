import { createSignal, Show } from 'solid-js';
import { ColorBlock } from '#components/ColorBlock';
import {
  MultiResourcePicker,
  type PickerQueryMeta,
  ResourcePicker,
} from '#components/ResourcePicker';
import { Divider, Widget } from '#components/Widget';
import type { PaginatedResponse } from '#shared/zod';
import style from './ResourcePickerTest.module.scss';

interface TestResource {
  uuid: string;
  name: string;
  color?: string;
}

const defaultResources: TestResource[] = [
  {
    uuid: 'resource-1',
    name: 'Ball A',
    color: '#f87171',
  },
  {
    uuid: 'resource-2',
    name: 'Ball B',
    color: '#38bdf8',
  },
  {
    uuid: 'resource-3',
    name: 'Ball C',
    color: '#4ade80',
  },
  {
    uuid: 'resource-wide',
    name: 'The longest resource entry used to verify marquee scrolling behavior',
    color: '#facc15',
  },
];

const manyResources: TestResource[] = Array.from({ length: 20 }, (_, index) => {
  const number = index + 1;

  return {
    uuid: `many-${number}`,
    name: `Resource ${number}`,
    color: ['#fb7185', '#34d399', '#60a5fa', '#facc15'][index % 4],
  };
});

const createResourceQuery =
  (resources: TestResource[]) =>
  async (
    meta: PickerQueryMeta = {},
  ): Promise<PaginatedResponse<TestResource>> => {
    const searchTerm = meta.search?.trim().toLowerCase() ?? '';

    const filteredResources = resources.filter((resource) => {
      if (!searchTerm) return true;

      return (
        resource.name.toLowerCase().includes(searchTerm) ||
        resource.uuid.toLowerCase().includes(searchTerm)
      );
    });

    const offset = meta.pagination?.offset ?? 0;
    const limit = meta.pagination?.limit ?? filteredResources.length;

    return {
      data: filteredResources.slice(offset, offset + limit),
      total: filteredResources.length,
    };
  };

const createResourceQueryById =
  (resources: TestResource[]) =>
  async (uuid: string): Promise<TestResource> => {
    const resource = resources.find((entry) => entry.uuid === uuid);

    if (!resource) {
      throw new Error(`Resource ${uuid} does not exist in this test dataset.`);
    }

    return resource;
  };

const defaultResourceQuery = createResourceQuery(defaultResources);
const defaultResourceQueryById = createResourceQueryById(defaultResources);

const emptyResourceQuery = createResourceQuery([]);
const emptyResourceQueryById = createResourceQueryById([]);

const manyResourceQuery = createResourceQuery(manyResources);
const manyResourceQueryById = createResourceQueryById(manyResources);

const toEntry = (resource: TestResource) => {
  return {
    label: (
      <>
        {resource.name}{' '}
        <Show when={resource.color}>
          {(color) => (
            <>
              (<ColorBlock color={color()} width={2} />)
            </>
          )}
        </Show>
      </>
    ),
    value: resource.uuid,
  };
};

export const ResourcePickerTest: Component = () => {
  const [basicPickerValue, setBasicPickerValue] = createSignal<
    string | undefined
  >('resource-1');
  const [emptyPickerValue, setEmptyPickerValue] = createSignal<
    string | undefined
  >(undefined);
  const [wideLabelPickerValue, setWideLabelPickerValue] = createSignal<
    string | undefined
  >('resource-wide');
  const [invalidPickerValue, setInvalidPickerValue] = createSignal<
    string | undefined
  >(undefined);
  const [manyPickerValue] = createSignal<string | undefined>('many-1');
  const [labelPickerValue, setLabelPickerValue] = createSignal<
    string | undefined
  >('resource-2');

  const [multiBasicValue] = createSignal<string[]>(['resource-1']);
  const [multiWideLabelValue] = createSignal<string[]>(['resource-wide']);
  const [multiManyValue] = createSignal<string[]>(['many-1', 'many-2']);

  return (
    <div class={style.outerContainer}>
      <Widget topLeftLabels="Resource Picker Component Tests">
        <div class={style.container}>
          <br />
          Basic picker:{' '}
          <ResourcePicker
            class={style.forcedPickerWidth}
            queryById={defaultResourceQueryById}
            placeholder="Select a resource..."
            query={defaultResourceQuery}
            toEntry={toEntry}
            value={basicPickerValue()}
            onChange={setBasicPickerValue}
          />{' '}
          Selected: {basicPickerValue() ?? 'none'}
          <Divider />
          Picker without default value:{' '}
          <ResourcePicker
            class={style.forcedPickerWidth}
            queryById={defaultResourceQueryById}
            placeholder="Select a resource..."
            query={defaultResourceQuery}
            toEntry={toEntry}
            value={emptyPickerValue()}
            onChange={setEmptyPickerValue}
          />{' '}
          Selected: {emptyPickerValue() ?? 'none'}
          <Divider />
          Disabled picker:{' '}
          <ResourcePicker
            class={style.forcedPickerWidth}
            disabled
            queryById={defaultResourceQueryById}
            query={defaultResourceQuery}
            toEntry={toEntry}
            value={'resource-1'}
          />
          <Divider />
          Invalid picker:{' '}
          <ResourcePicker
            class={style.forcedPickerWidth}
            invalid
            queryById={defaultResourceQueryById}
            placeholder="Selection is required..."
            query={defaultResourceQuery}
            toEntry={toEntry}
            value={invalidPickerValue()}
            onChange={setInvalidPickerValue}
          />{' '}
          Selected: {invalidPickerValue() ?? 'none'}
          <Divider />
          Empty picker:{' '}
          <ResourcePicker
            class={style.forcedPickerWidth}
            queryById={emptyResourceQueryById}
            placeholder="No resources available..."
            query={emptyResourceQuery}
            toEntry={toEntry}
          />
          <Divider />
          Wide labels:{' '}
          <ResourcePicker
            class={style.forcedPickerWidth}
            queryById={defaultResourceQueryById}
            query={defaultResourceQuery}
            toEntry={toEntry}
            value={wideLabelPickerValue()}
            onChange={setWideLabelPickerValue}
          />
          <Divider />
          Many options:{' '}
          <ResourcePicker
            class={style.forcedPickerWidth}
            queryById={manyResourceQueryById}
            query={manyResourceQuery}
            toEntry={toEntry}
            value={manyPickerValue()}
          />
          <Divider />
          Multiple side by side:
          <div class={style.sideBySide}>
            <ResourcePicker
              class={style.forcedPickerWidth}
              queryById={defaultResourceQueryById}
              query={defaultResourceQuery}
              toEntry={toEntry}
              value={'resource-1'}
            />

            <ResourcePicker
              class={style.forcedPickerWidth}
              queryById={defaultResourceQueryById}
              query={defaultResourceQuery}
              toEntry={toEntry}
              value={'resource-2'}
            />

            <ResourcePicker
              class={style.forcedPickerWidth}
              queryById={defaultResourceQueryById}
              query={defaultResourceQuery}
              toEntry={toEntry}
              value={'resource-3'}
            />
          </div>
        </div>
      </Widget>

      <Widget topLeftLabels="Multi Resource Picker Component Tests">
        <div class={style.container}>
          <br />
          Basic multi picker:
          <MultiResourcePicker
            queryById={defaultResourceQueryById}
            query={defaultResourceQuery}
            toEntry={toEntry}
            value={multiBasicValue()}
          />
          <Divider />
          Multi picker without default values:
          <MultiResourcePicker
            queryById={defaultResourceQueryById}
            query={defaultResourceQuery}
            toEntry={toEntry}
            value={[]}
          />
          <Divider />
          Disabled multi picker:
          <MultiResourcePicker
            disabled
            queryById={defaultResourceQueryById}
            query={defaultResourceQuery}
            toEntry={toEntry}
            value={multiBasicValue()}
          />
          <Divider />
          Invalid multi picker:
          <MultiResourcePicker
            invalid
            queryById={defaultResourceQueryById}
            query={defaultResourceQuery}
            toEntry={toEntry}
            value={[]}
          />
          <Divider />
          Empty multi picker:
          <MultiResourcePicker
            queryById={emptyResourceQueryById}
            query={emptyResourceQuery}
            toEntry={toEntry}
            value={[]}
          />
          <Divider />
          Wide labels:
          <MultiResourcePicker
            queryById={defaultResourceQueryById}
            query={defaultResourceQuery}
            toEntry={toEntry}
            value={multiWideLabelValue()}
          />
          <Divider />
          Many options:
          <MultiResourcePicker
            queryById={manyResourceQueryById}
            query={manyResourceQuery}
            toEntry={toEntry}
            value={multiManyValue()}
          />
          <Divider />
          Multiple side by side:
          <div class={style.sideBySide}>
            <MultiResourcePicker
              queryById={defaultResourceQueryById}
              query={defaultResourceQuery}
              toEntry={toEntry}
              value={['resource-1']}
            />

            <MultiResourcePicker
              queryById={defaultResourceQueryById}
              query={defaultResourceQuery}
              toEntry={toEntry}
              value={['resource-2']}
            />
          </div>
        </div>
      </Widget>

      <Widget
        topLeftLabels={[
          'Resource Picker in Widget Labels',
          <ResourcePicker
            class={style.forcedPickerWidth}
            queryById={defaultResourceQueryById}
            query={defaultResourceQuery}
            toEntry={toEntry}
            value={labelPickerValue()}
            onChange={setLabelPickerValue}
          />,
        ]}
        topRightLabels={
          <ResourcePicker
            class={style.forcedPickerWidth}
            queryById={defaultResourceQueryById}
            query={defaultResourceQuery}
            toEntry={toEntry}
            value={labelPickerValue()}
            onChange={setLabelPickerValue}
          />
        }
        bottomLeftLabels={
          <ResourcePicker
            class={style.forcedPickerWidth}
            queryById={defaultResourceQueryById}
            query={defaultResourceQuery}
            toEntry={toEntry}
            value={labelPickerValue()}
            onChange={setLabelPickerValue}
          />
        }
        bottomRightLabels={
          <ResourcePicker
            class={style.forcedPickerWidth}
            queryById={defaultResourceQueryById}
            query={defaultResourceQuery}
            toEntry={toEntry}
            value={labelPickerValue()}
            onChange={setLabelPickerValue}
          />
        }
      >
        <div class={style.container}>
          <br />
          Test picker behavior when used as widget labels.
          <Divider />
          Top left: {labelPickerValue() ?? 'none'} | Top right:{' '}
          {labelPickerValue() ?? 'none'} | Bottom left:{' '}
          {labelPickerValue() ?? 'none'} | Bottom right:{' '}
          {labelPickerValue() ?? 'none'}
        </div>
      </Widget>
    </div>
  );
};

export default ResourcePickerTest;
