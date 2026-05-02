import spin from '#assets/images/spin.gif';
import { VanillaAnchorButton } from '#components/Button';
import { Divider } from '#components/Widget';
import style from './GenericErrorPage.module.scss';

export interface ErrorConfig {
  message: string;
}

export interface GenericErrorPageProps {
  config: ErrorConfig;
  error?: Error;
}

export const GenericErrorPage: Component<GenericErrorPageProps> = (props) => {
  return (
    <div class={style.container}>
      <img src={spin} class={style.animation} alt="Error animation" />

      <span class={style.text}>{props.config.message}</span>

      <Divider />

      <VanillaAnchorButton href="/">Back to homepage</VanillaAnchorButton>
    </div>
  );
};

export default GenericErrorPage;

export const errors = {
  pageNotFound: {
    message: 'This is not the way',
  },
  internalError: {
    message: 'Something went wrong',
  },
} satisfies Record<string, ErrorConfig>;
