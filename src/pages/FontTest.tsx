import { MaterialSymbol } from '#components/MaterialSymbol';
import style from '#styles/FontTest.module.scss';

const FontTest: Component = () => {
  return (
    <div class={style.container}>
      <div>
        <span class={style.defaultFont}>Default Font: TEST 123 test TEST</span>
        <span class={style.defaultFont}>2</span>
        <MaterialSymbol
          symbol="cloud_upload"
          color="gray"
          interactive={true}
          highlightColor="primary"
        />
        <span class={style.testBox} />
        {/* <span
          classList={{
            [style.defaultFont]: true,
            [style.cuTest]: true,
          }}
        >
          ├─┼─┤
        </span> */}
      </div>
    </div>
  );
};

export default FontTest;
