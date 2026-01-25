import type { JSX } from 'solid-js';
import type { CustomButtonProps } from '#components/Button';

export type ToastSeverity = 'info' | 'success' | 'warning' | 'error';

export type ToastAction = {
  label: string;
  severity?: CustomButtonProps['severity'];
  onClick: () => void;
};

export type ToastConfig = {
  message: string | JSX.Element;
  severity?: ToastSeverity;
  duration?: number | null;
  dismissible?: boolean;
  actions?: ToastAction[];
};

export type ToastEntry = ToastConfig & {
  id: string;
  createdAt: number;
  dismiss: () => void;
};

export type ToastProviderConfig = {
  maxVisible?: number;
  defaultDuration?: number;
};
