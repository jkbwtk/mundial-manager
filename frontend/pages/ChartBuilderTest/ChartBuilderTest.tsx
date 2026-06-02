import { ChartBuilder } from '#components/ChartBuilder/ChartBuilder';
import style from './ChartBuilderTest.module.scss';

const ChartBuilderTest: Component = () => {
  return (
    <div class={style.container}>
      <ChartBuilder />
    </div>
  );
};

export default ChartBuilderTest;
