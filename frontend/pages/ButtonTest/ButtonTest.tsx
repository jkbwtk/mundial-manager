import { Button } from '#components/Button';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { Divider, Widget } from '#components/Widget';
import style from './ButtonTest.module.scss';

const ButtonTest: Component = () => {
  return (
    <Widget topLeftLabels="Button Test Page" class={style.container}>
      <br />
      Primary button: <Button>Test</Button>
      <Divider />
      Secondary button: <Button severity="secondary">Test</Button>
      <Divider />
      Danger button: <Button severity="danger">Test</Button>
      <Divider />
      Disabled button: <Button disabled={true}>Test</Button>
      <Divider />
      Buttons with material symbol:{' '}
      <Button>
        <MaterialSymbol symbol="folder" /> Test
      </Button>{' '}
      <Button severity="secondary">
        <MaterialSymbol symbol="music_note" /> Test
      </Button>{' '}
      <Button severity="danger">
        <MaterialSymbol symbol="description" /> Test
      </Button>{' '}
      <Button disabled={true}>
        <MaterialSymbol symbol="cloud_upload" /> Test
      </Button>
    </Widget>
  );
};

export default ButtonTest;
