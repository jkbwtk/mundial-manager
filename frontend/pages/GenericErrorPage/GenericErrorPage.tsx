import { Show } from 'solid-js';
import spin from '#assets/images/spin.gif';
import { Button, VanillaAnchorButton } from '#components/Button';
import { Divider } from '#components/Widget';
import { isDev } from '#flib/utils';
import { useSSRUtils } from '#providers/SSRUtilsProvider';
import style from './GenericErrorPage.module.scss';

export interface ErrorConfig {
  message: string;
  status?: number;
}

export interface GenericErrorPageProps {
  config: ErrorConfig;
  error?: Error;
  reset?: () => void;
}

export const GenericErrorPage: Component<GenericErrorPageProps> = (props) => {
  const [, { setResponseStatus }] = useSSRUtils();

  if (props.config.status) {
    setResponseStatus(props.config.status);
  }

  return (
    <div class={style.container}>
      <img src={spin} class={style.animation} alt="Error animation" />

      <span class={style.text}>{props.config.message}</span>

      <Divider />

      <Show when={props.reset}>
        <Button severity="danger" onClick={props.reset}>
          Try again
        </Button>
      </Show>

      <Divider />

      <VanillaAnchorButton severity="secondary" href="/">
        Back to homepage
      </VanillaAnchorButton>

      <Divider />

      <Show when={props.error}>
        {(error) => (
          <details class={style.errorDetails} open={isDev()}>
            <summary>Details</summary>
            <span>
              <strong>{error().name}</strong>: {error().message}
            </span>
          </details>
        )}
      </Show>
    </div>
  );
};

export default GenericErrorPage;

export const errors = {
  pageNotFound: {
    message: 'This is not the way',
    status: 404,
  },
  internalError: {
    message: 'Something went wrong',
  },
} satisfies Record<string, ErrorConfig>;
