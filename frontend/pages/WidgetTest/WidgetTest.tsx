import { Break } from '#components/Break';
import { Button } from '#components/Button';
import { InlineAction } from '#components/InlineAction';
import {
  MatchPaginatorWidget,
  usePaginatedFrame,
} from '#components/MatchPaginatorWidget';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { customWidgetType, Divider, Widget } from '#components/Widget';
import { WidgetAlt } from '#components/WidgetAlt';
import style from './WidgetTest.module.scss';

const ButtonWidget = customWidgetType('button');

const WidgetTest: Component = () => {
  return (
    <div class={style.container}>
      <Widget
        topLeftLabels={['Widget Test Page', 'Secondary Title']}
        topRightLabels={['v1.0.0', <span>Status: Active</span>]}
        bottomLeftLabels="Additional info"
        bottomRightLabels="Testing various widget configurations"
        style={{
          '--widget-border-color': 'red',
        }}
      >
        <div
        // style={{
        //   'max-height': 'calc(5 * 18.666667px)',
        //   'overflow-y': 'auto',
        //   'overflow-x': 'hidden',
        // }}
        >
          This is the main test widget. 1231231231231231231231231231231231
          <br />
          Test
          <br />
          Test
          <Divider />
          <div style={{ display: 'flex' }}>
            <div>
              Test 123 123 123 123
              <br />
              Test
              <br />
              Test
              <br />
              Test
            </div>
            <Divider direction="vertical" colors={0b01} />
            <div>
              Test
              <br />
              Test
              <br />
              Test
              <br />
              Test
            </div>
          </div>
        </div>
      </Widget>

      <Divider />

      <WidgetAlt>This is alt widget</WidgetAlt>

      <Widget topLeftLabels="Basic Widget">
        Simple widget with just a title and content.
      </Widget>

      <Widget
        topLeftLabels="Widget with Subtitle"
        bottomRightLabels="Subtitle text"
      >
        This widget has both a title and subtitle.
      </Widget>

      <Widget
        topLeftLabels="Widget with Number Subtitle"
        bottomRightLabels={42}
      >
        This widget has a numeric subtitle.
      </Widget>

      <Widget topLeftLabels="Widget with Long Title That Should Marquee When It Overflows">
        Testing title overflow behavior with marquee effect.
      </Widget>

      <Widget topLeftLabels="Complex Content" bottomRightLabels="Rich content">
        <div>
          <p>This widget contains multiple elements:</p>
          <Divider />
          <Button>Test Button</Button>
          <Divider />
          <MaterialSymbol symbol="check_box" /> Icon with text
          <Divider />
          <span>More content here</span>
        </div>
      </Widget>

      <ButtonWidget
        topLeftLabels="Widget as Button"
        bottomRightLabels="Interactive"
        style={{
          width: '100%',
        }}
        onPointerUp={() => alert('Button widget clicked')}
      >
        This widget uses a button as its root component.
      </ButtonWidget>

      <Widget topLeftLabels="Minimal Content">Short</Widget>

      <Widget topLeftLabels="Empty Widget" bottomRightLabels="No content" />

      <Widget
        topLeftLabels="Widget with inline action"
        topRightLabels={
          <span>
            Tes
            <InlineAction
              symbol="t"
              onAction={(type) => alert(`Action triggered through: ${type}`)}
            />
          </span>
        }
      >
        Lorem ipsum dolor sit amet consectetur adipisicing elit.
        <input />
      </Widget>

      <Break />

      <MatchPaginatorWidget topRightLabels={'test'}>
        {usePaginatedFrame()().matchStats.label}
      </MatchPaginatorWidget>
    </div>
  );
};

export default WidgetTest;
