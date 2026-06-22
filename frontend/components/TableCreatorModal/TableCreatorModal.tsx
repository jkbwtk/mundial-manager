import { ModalForm, type ModalFormLabels } from '#components/ModalForm';
import { actionCreateTable, actionUpdateTable } from '#flib/trpcCalls';
import { type Table, TableCreate, TableUpdate } from '#shared/types/api/table';
import style from './TableCreatorModal.module.scss';

export interface TableCreatorModalProps {
  table?: Table;
}

export const TableCreatorModal: Component<TableCreatorModalProps> = (props) => {
  const isCreating = props.table === undefined;

  const config: ModalFormLabels = isCreating
    ? {
        title: 'Table Creator',
        submitButtonText: 'Create',
        successMessage: 'Table created successfully!',
        errorMessage: 'Failed to create table. Please try again.',
        logLabel: 'Table creation error:',
      }
    : {
        title: 'Table Editor',
        submitButtonText: 'Update',
        successMessage: 'Table updated successfully!',
        errorMessage: 'Failed to update table. Please try again.',
        logLabel: 'Table update error:',
      };

  return (
    <ModalForm
      class={style.modal}
      instance={props.table}
      model={isCreating ? TableCreate : TableUpdate}
      // @ts-expect-error
      action={isCreating ? actionCreateTable : actionUpdateTable}
      {...config}
      fields={{
        uuid: {
          label: 'UUID',
          type: 'text',
          hidden: true,
          implicitDefault: props.table?.uuid,
        },
        name: {
          label: 'Name',
          placeholder: 'Table name...',
          type: 'text',
        },
        alias: {
          label: 'Alias',
          placeholder: 'Table alias...',
          type: 'text',
        },
        location: {
          label: 'Location',
          placeholder: 'Table location...',
          type: 'text',
        },
        side1Color: {
          label: 'Side 1 color',
          type: 'color',
        },
        side2Color: {
          label: 'Side 2 color',
          type: 'color',
        },
        labels: {
          label: 'Labels',
          type: 'text',
          hidden: true,
          implicitDefault: props.table?.labels ?? [],
        },
        description: {
          label: 'Description',
          placeholder: 'Table description...',
          type: 'textArea',
        },
      }}
    />
  );
};
