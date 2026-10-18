import { ModalForm } from '#components/ModalForm';
import { seasonCreatorConfigFields } from '#components/SeasonCreatorModal';
import { timeZoneOptions } from '#flib/timeZones';
import { actionUpdateActiveLeague } from '#flib/trpcCalls';
import { type League, LeagueSettingsUpdate } from '#shared/types/api/league';
import style from './LeagueSettingsModal.module.scss';

export interface LeagueSettingsModalProps {
  league: League;
}

export const LeagueSettingsModal: Component<LeagueSettingsModalProps> = (
  props,
) => {
  return (
    <ModalForm
      class={style.modal}
      instance={props.league}
      model={LeagueSettingsUpdate}
      action={actionUpdateActiveLeague}
      title="League Settings"
      submitButtonText="Update"
      successMessage="League updated successfully!"
      errorMessage="Failed to update league. Please try again."
      logLabel="League update error:"
      fields={{
        name: {
          label: 'Name',
          placeholder: 'League name...',
          type: 'text',
        },
        description: {
          label: 'Description',
          placeholder: 'League description...',
          type: 'textArea',
        },
        timezone: {
          label: 'Timezone',
          type: 'dropdown',
          options: timeZoneOptions,
          searchable: true,
        },
        seasonConfig: {
          label: 'Season Defaults',
          type: 'object',
          fields: {
            ...seasonCreatorConfigFields,
            goalTypes: {
              label: 'Goal Types',
              type: 'text',
              hidden: true,
              implicitDefault: props.league.seasonConfig.goalTypes,
            },
          },
        },
      }}
    />
  );
};
