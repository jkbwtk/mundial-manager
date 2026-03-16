import { ChartBuilder } from '#components/ChartBuilder/ChartBuilder';
import { Widget } from '#components/Widget';
import style from './ChartBuilderTest.module.scss';

const ChartBuilderTest: Component = () => {
  return (
    <Widget topLeftLabels="Chart Builder" class={style.container}>
      <ChartBuilder />
    </Widget>
  );
};

export default ChartBuilderTest;
