import type { getOwner, ValidComponent } from 'solid-js';
import type { DynamicProps } from 'solid-js/web';

export type ModalOwner = ReturnType<typeof getOwner>;

export type ModalOpenOptions<T extends ValidComponent> = {
  props: Omit<DynamicProps<T>, 'component'> & {
    component: T;
  };
  owner?: ModalOwner;
  afterClose?: (returnValue: unknown) => void;
  closeOnBackgroundClick?: boolean;
};

export interface ModalEntry<T extends ValidComponent = ValidComponent> {
  id: string;
  props: DynamicProps<T>;
  owner: () => ModalOwner | null;
  closeModal: (returnValue?: unknown) => void;
  closeOnBackgroundClick: boolean;
}
