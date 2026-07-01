import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import { ModalForm, type ModalFormLabels } from '#components/ModalForm';
import { actionCreateBall, actionUpdateBall } from '#flib/trpcCalls';
import { type Ball, BallCreate, BallUpdate } from '#shared/types/api/ball';
import style from './BallCreatorModal.module.scss';

hljs.registerLanguage('json', json);

export interface BallCreatorModalProps {
  ball?: Ball;
}

export const BallCreatorModal: Component<BallCreatorModalProps> = (props) => {
  const isCreating = props.ball === undefined;

  const config: ModalFormLabels = isCreating
    ? {
        title: 'Ball Creator',
        submitButtonText: 'Create',
        successMessage: 'Ball created successfully!',
        errorMessage: 'Failed to create ball. Please try again.',
        logLabel: 'Ball creation error:',
      }
    : {
        title: 'Ball Editor',
        submitButtonText: 'Update',
        successMessage: 'Ball updated successfully!',
        errorMessage: 'Failed to update ball. Please try again.',
        logLabel: 'Ball update error:',
      };

  return (
    <ModalForm
      class={style.modal}
      instance={props.ball}
      model={isCreating ? BallCreate : BallUpdate}
      // @ts-expect-error
      action={isCreating ? actionCreateBall : actionUpdateBall}
      {...config}
      fields={{
        uuid: {
          label: 'UUID',
          type: 'text',
          hidden: true,
          implicitDefault: props.ball?.uuid,
        },
        name: {
          label: 'Name',
          placeholder: 'Ball name...',
          type: 'text',
        },
        alias: {
          label: 'Alias',
          placeholder: 'Ball alias...',
          type: 'text',
        },
        color: {
          label: 'Color',
          type: 'color',
        },
        diameter: {
          label: 'Diameter',
          placeholder: 'Ball diameter...',
          type: 'number',
          unit: 'mm',
        },
        weight: {
          label: 'Weight',
          placeholder: 'Ball weight...',
          type: 'number',
          unit: 'g',
        },
        description: {
          label: 'Description',
          placeholder: 'Ball description...',
          type: 'textArea',
        },
        labels: {
          label: 'Labels',
          type: 'text',
          hidden: true,
          implicitDefault: props.ball?.labels ?? {},
        },
      }}
    />
  );
};
