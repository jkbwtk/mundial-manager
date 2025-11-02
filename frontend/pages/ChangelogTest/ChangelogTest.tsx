import { Button } from '#components/Button';
import { Divider, Widget } from '#components/Widget';
import { useChangelogContext } from '#providers/ChangelogProvider';
import style from './ChangelogTest.module.scss';

const ChangelogTest: Component = () => {
  const [state, actions] = useChangelogContext();

  return (
    <Widget topLeftLabels="Changelog Test Page" class={style.container}>
      <br />
      <div>Valid: {state.valid ? 'Yes' : 'No'}</div>
      <div>Versions loaded: {state.changelog.versions.length}</div>
      <Divider />
      <div>
        <strong>Configuration:</strong>
      </div>
      <div>
        Disabled permanently: {state.config.disabledPermanently ? 'Yes' : 'No'}
      </div>
      <div>
        Disabled until next version:{' '}
        {state.config.disabledUntilNextVersion ? 'Yes' : 'No'}
      </div>
      <div>Last viewed version: {state.config.lastViewedVersion ?? 'None'}</div>
      <Divider />
      <Button onClick={() => actions.openChangelog()}>Open Changelog</Button>{' '}
      <Button
        severity="secondary"
        onClick={() => actions.disableUntilNextVersion()}
      >
        Disable Until Next Version
      </Button>{' '}
      <Button severity="danger" onClick={() => actions.disablePermanently()}>
        Disable Permanently
      </Button>{' '}
      <Button severity="secondary" onClick={() => actions.resetOptions()}>
        Reset Options
      </Button>
    </Widget>
  );
};

export default ChangelogTest;
