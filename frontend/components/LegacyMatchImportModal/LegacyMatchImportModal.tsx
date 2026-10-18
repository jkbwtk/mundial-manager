import { ModalForm } from '#components/ModalForm';
import { actionImportLegacyMatch } from '#flib/trpcCalls';
import { MatchImport as LegacyMatchImport } from '#shared/types/Sheets';
import style from './LegacyMatchImportModal.module.scss';

export const LegacyMatchImportModal: Component = () => {
  return (
    <ModalForm
      class={style.modal}
      model={LegacyMatchImport}
      action={actionImportLegacyMatch}
      title="Legacy Match Import"
      submitButtonText="Import"
      successMessage="Match imported successfully!"
      errorMessage="Failed to import match. Please try again."
      logLabel="Legacy match import error:"
      fields={{
        row: {
          label: 'Sheet Row',
          placeholder: 'Copied sheet row...',
          type: 'textArea',
        },
      }}
    />
  );
};
