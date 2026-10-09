import { ModalForm } from '#components/ModalForm';
import { useCopyToClipboard } from '#flib/clipboard';
import { actionCreateLeagueLink } from '#flib/trpcCalls';
import { useModalActions } from '#providers/ModalProvider';
import {
  type League,
  LeagueLinkQuery,
  LeagueLinkRole,
} from '#shared/types/api/league';
import style from './LeagueLinkModal.module.scss';

const LeagueLinkRoleLabels: Record<LeagueLinkRole, string> = {
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

export interface LeagueLinkModalProps {
  league: League;
}

export const LeagueLinkModal: Component<LeagueLinkModalProps> = (props) => {
  const { closeModal } = useModalActions();
  const copyToClipboard = useCopyToClipboard();

  const handleSuccess = async (link: string) => {
    await copyToClipboard(link, `Magic link for ${props.league.alias}`);

    closeModal(link);
  };

  return (
    <ModalForm
      class={style.modal}
      model={LeagueLinkQuery}
      action={actionCreateLeagueLink}
      title={`Magic Link for ${props.league.alias}`}
      submitButtonText="Generate"
      successMessage="Magic link generated successfully!"
      errorMessage="Failed to generate magic link. Please try again."
      logLabel="Magic link generation error:"
      onSuccess={handleSuccess}
      fields={{
        uuid: {
          label: 'UUID',
          type: 'text',
          hidden: true,
          implicitDefault: props.league.uuid,
        },
        role: {
          label: 'Role',
          type: 'dropdown',
          options: LeagueLinkRole.options.map((role) => ({
            label: LeagueLinkRoleLabels[role],
            value: role,
          })),
        },
        ttl: {
          label: 'Time to live',
          placeholder: 'Link TTL...',
          type: 'number',
          unit: 'days',
          min: 1,
          max: 365,
        },
      }}
    />
  );
};
