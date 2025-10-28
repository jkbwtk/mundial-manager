import type { ValidComponent } from 'solid-js';
import type { DynamicProps } from 'solid-js/web';

export interface ModalEntry<T extends ValidComponent = ValidComponent> {
  props: DynamicProps<T>;
  closeModal: (returnValue?: unknown) => void;
}
