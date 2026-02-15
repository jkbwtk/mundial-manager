import { createSignal } from 'solid-js';
import { Dropdown, type DropdownOption } from '#components/Dropdown';
import { Divider, Widget } from '#components/Widget';
import style from './DropdownTest.module.scss';

export const DropdownTest: Component = () => {
  const [basicDropdownValue, setBasicDropdownValue] = createSignal('option1');
  const [emptyDropdownValue, setEmptyDropdownValue] = createSignal('');
  const [wideLabelDropdownValue] = createSignal('short');
  const [manyOptionsDropdownValue] = createSignal('item1');
  const [labelDropdownValue, setLabelDropdownValue] = createSignal('day');

  const aggregateLabels: DropdownOption[] = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Season', value: 'season' },
    { label: 'Long Label to test anchor positions', value: 'long' },
  ];

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
          Empty dropdown: <Dropdown value={''} options={[]} />
          <Divider />
          Wide labels:{' '}
          <Dropdown
            value={wideLabelDropdownValue()}
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
