import { createSignal } from 'solid-js';
import { Dropdown, type DropdownOption } from '#components/Dropdown';
import { Divider, Widget } from '#components/Widget';
import style from './DropdownTest.module.scss';

export const DropdownTest: Component = () => {
  const [basicDropdownValue, setBasicDropdownValue] = createSignal('option1');
  const [emptyDropdownValue, setEmptyDropdownValue] = createSignal('');
  const [invalidDropdownValue, setInvalidDropdownValue] = createSignal('');
  const [wideLabelDropdownValue, setWideLabelDropdownValue] =
    createSignal('short');
  const [manyOptionsDropdownValue] = createSignal('item1');
  const [labelDropdownValue, setLabelDropdownValue] = createSignal('day');
  const [multipleChoiceValue, setMultipleChoiceValue] = createSignal(['day']);
  const [searchableDropdownValue, setSearchableDropdownValue] =
    createSignal('item1');
  const [searchableMultipleValue, setSearchableMultipleValue] = createSignal([
    'item1',
  ]);
  const [preselectedDropdownValue, setPreselectedDropdownValue] =
    createSignal('option1');
  const [preselectedMultipleValue, setPreselectedMultipleValue] = createSignal<
    string[]
  >([]);

  const aggregateLabels: DropdownOption[] = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Season', value: 'season' },
    { label: 'Long Label to test anchor positions', value: 'long' },
  ];

  const manyOptions: DropdownOption[] = Array.from({ length: 40 }).map(
    (_, i) => ({
      label: `Item ${i + 1}`,
      value: `item${i + 1}`,
    }),
  );

  const preselectedOptions = ['option2', 'option3'];

  const isPreselected = (value: string) => preselectedOptions.includes(value);

  return (
    <div class={style.outerContainer}>
      <Widget topLeftLabels="Dropdown Component Tests">
        <div class={style.container}>
          <br />
          Basic dropdown:{' '}
          <Dropdown
            value={basicDropdownValue()}
            onChange={setBasicDropdownValue}
            options={[
              { label: 'Option 1', value: 'option1' },
              { label: 'Option 2', value: 'option2' },
              { label: 'Option 3', value: 'option3' },
              { label: 'Option 4', value: 'option4' },
            ]}
          />{' '}
          Selected: {basicDropdownValue()}
          <Divider />
          Dropdown without default option:{' '}
          <Dropdown
            value={emptyDropdownValue()}
            onChange={setEmptyDropdownValue}
            options={[
              { label: 'Option 1', value: 'option1' },
              { label: 'Option 2', value: 'option2' },
              { label: 'Option 3', value: 'option3' },
              { label: 'Option 4', value: 'option4' },
            ]}
          />{' '}
          Selected: {emptyDropdownValue()}
          <Divider />
          Disabled dropdown:{' '}
          <Dropdown
            disabled
            value={'test'}
            options={[
              {
                label: 'Test',
                value: 'test',
              },
            ]}
          />
          <Divider />
          Invalid dropdown:{' '}
          <Dropdown
            invalid
            value={invalidDropdownValue()}
            onChange={setInvalidDropdownValue}
            options={[
              { label: 'Option 1', value: 'option1' },
              { label: 'Option 2', value: 'option2' },
              { label: 'Option 3', value: 'option3' },
              { label: 'Option 4', value: 'option4' },
            ]}
          />{' '}
          Selected: {invalidDropdownValue()}
          <Divider />
          Empty dropdown: <Dropdown value={''} options={[]} />
          <Divider />
          Wide labels:{' '}
          <Dropdown
            value={wideLabelDropdownValue()}
            onChange={setWideLabelDropdownValue}
            options={[
              { label: 'Short', value: 'short' },
              { label: 'A much wider label that overflows', value: 'wide' },
              { label: 'Medium length', value: 'medium' },
            ]}
          />
          <Divider />
          Many options:{' '}
          <Dropdown
            value={manyOptionsDropdownValue()}
            options={Array.from({ length: 15 }).map((_, i) => ({
              label: `Item ${i + 1}`,
              value: `item${i + 1}`,
            }))}
          />
          <Divider />
          Searchable dropdown:{' '}
          <Dropdown
            searchable
            value={searchableDropdownValue()}
            onChange={setSearchableDropdownValue}
            options={manyOptions}
          />{' '}
          Selected: {searchableDropdownValue()}
          <Divider />
          Preselected options (Option 2, Option 3):{' '}
          <Dropdown
            value={preselectedDropdownValue()}
            onChange={setPreselectedDropdownValue}
            isPreselected={isPreselected}
            options={[
              { label: 'Option 1', value: 'option1' },
              { label: 'Option 2', value: 'option2' },
              { label: 'Option 3', value: 'option3' },
              { label: 'Option 4', value: 'option4' },
            ]}
          />{' '}
          Selected: {preselectedDropdownValue()}
          <Divider />
          Multiple side by side:{' '}
          <Dropdown
            value={'test'}
            options={[{ label: 'Test', value: 'test' }]}
          />{' '}
          <Dropdown
            value={'test'}
            options={[{ label: 'Test', value: 'test' }]}
          />{' '}
          <Dropdown
            value={'test'}
            options={[{ label: 'Test', value: 'test' }]}
          />
        </div>
        <Divider />
        Multi choice picker{' '}
        <Dropdown
          class={style.forcedDropdownWidth}
          options={aggregateLabels}
          value={multipleChoiceValue()}
          onChange={setMultipleChoiceValue}
          anchor="left"
          multiple
        />
        <Divider />
        Searchable multi choice picker (select all/none applies to the filtered
        options){' '}
        <Dropdown
          class={style.forcedDropdownWidth}
          options={manyOptions}
          value={searchableMultipleValue()}
          onChange={setSearchableMultipleValue}
          anchor="left"
          multiple
          searchable
        />{' '}
        Selected: {searchableMultipleValue().join(', ')}
        <Divider />
        Preselected multi choice picker (Option 2, Option 3){' '}
        <Dropdown
          class={style.forcedDropdownWidth}
          options={[
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' },
            { label: 'Option 3', value: 'option3' },
            { label: 'Option 4', value: 'option4' },
          ]}
          value={preselectedMultipleValue()}
          onChange={setPreselectedMultipleValue}
          isPreselected={isPreselected}
          anchor="left"
          multiple
        />{' '}
        Selected: {preselectedMultipleValue().join(', ')}
      </Widget>

      <Widget
        topLeftLabels={[
          'Dropdown in Widget Labels',
          <Dropdown
            options={aggregateLabels}
            value={labelDropdownValue()}
            onChange={setLabelDropdownValue}
            anchor="middle"
          />,
        ]}
        topRightLabels={
          <Dropdown
            options={aggregateLabels}
            value={labelDropdownValue()}
            onChange={setLabelDropdownValue}
            anchor="left"
          />
        }
        bottomLeftLabels={
          <Dropdown
            options={aggregateLabels}
            value={labelDropdownValue()}
            onChange={setLabelDropdownValue}
            anchor="left"
          />
        }
        bottomRightLabels={
          <Dropdown
            options={aggregateLabels}
            value={labelDropdownValue()}
            onChange={setLabelDropdownValue}
          />
        }
      >
        <div class={style.container}>
          <br />
          Test dropdown behavior when used as widget labels
          <Divider /> Top left: {labelDropdownValue()} | Top right:{' '}
          {labelDropdownValue()} | Bottom left: {labelDropdownValue()} | Bottom
          right: {labelDropdownValue()}
        </div>
      </Widget>
    </div>
  );
};

export default DropdownTest;
