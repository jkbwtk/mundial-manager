import type { ValidComponent } from 'solid-js';
import type { DynamicProps } from 'solid-js/web';

export type ModalOpenOptions<T extends ValidComponent> = {
  props: Omit<DynamicProps<T>, 'component'> & {
    component: T;
  };
  afterClose?: (returnValue: unknown) => void;
  closeOnBackgroundClick?: boolean;
};

export interface ModalEntry<T extends ValidComponent = ValidComponent> {
  id: string;
  props: DynamicProps<T>;
  closeModal: (returnValue?: unknown) => void;
  closeOnBackgroundClick: boolean;
}
