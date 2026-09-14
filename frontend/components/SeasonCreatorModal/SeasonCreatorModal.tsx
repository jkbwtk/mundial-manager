import { ModalForm, type ModalFormLabels } from '#components/ModalForm';
import { actionCreateSeason, actionUpdateSeason } from '#flib/trpcCalls';
import {
  type Season,
  SeasonCreate,
  SeasonUpdate,
} from '#shared/types/api/season';
import { defaultSeasonConfig } from '#shared/types/api/seasonDefaults';
import style from './SeasonCreatorModal.module.scss';

export interface SeasonCreatorModalProps {
  season?: Season;
}

export const SeasonCreatorModal: Component<SeasonCreatorModalProps> = (
  props,
) => {
  const isCreating = props.season === undefined;

  const config: ModalFormLabels = isCreating
    ? {
        title: 'Season Creator',
        submitButtonText: 'Create',
        successMessage: 'Season created successfully!',
        errorMessage: 'Failed to create season. Please try again.',
        logLabel: 'Season creation error:',
      }
    : {
        title: 'Season Editor',
        submitButtonText: 'Update',
        successMessage: 'Season updated successfully!',
        errorMessage: 'Failed to update season. Please try again.',
        logLabel: 'Season update error:',
      };

  return (
    <ModalForm
      class={style.modal}
      instance={props.season}
      initialValues={
        isCreating
          ? { config: structuredClone(defaultSeasonConfig) }
          : undefined
      }
      model={isCreating ? SeasonCreate : SeasonUpdate}
      // @ts-expect-error
      action={isCreating ? actionCreateSeason : actionUpdateSeason}
      {...config}
      fields={{
        uuid: {
          label: 'UUID',
          type: 'text',
          hidden: true,
          implicitDefault: props.season?.uuid,
        },
        name: {
          label: 'Name',
          placeholder: 'Season name...',
          type: 'text',
        },
        startDate: {
          label: 'Start Date',
          type: 'date',
        },
        endDate: {
          label: 'End Date',
          type: 'date',
        },
        config: {
          label: 'Config',
          type: 'object',
          fields: {
            resetRatings: {
              label: 'Reset Ratings',
              type: 'checkbox',
            },
            defaultEloRating: {
              label: 'Default Elo Rating',
              placeholder: 'Default Elo rating...',
              type: 'number',
            },
            defaultGlicko2Rating: {
              label: 'Default Glicko-2 Rating',
              placeholder: 'Default Glicko-2 rating...',
              type: 'number',
            },
            defaultGlicko2RD: {
              label: 'Default Glicko-2 RD',
              placeholder: 'Default Glicko-2 RD...',
              type: 'number',
            },
            defaultGlicko2Volatility: {
              label: 'Default Glicko-2 Volatility',
              placeholder: 'Default Glicko-2 volatility...',
              type: 'number',
              step: 'any',
            },
            eloKFactorRanges: {
              label: 'Elo K-Factor Ranges',
              type: 'record',
              keyPlaceholder: 'Bound or "default"...',
              valuePlaceholder: 'K-factor...',
            },
            eloScoreMultipliers: {
              label: 'Elo Score Multipliers',
              type: 'record',
              keyPlaceholder: 'Diff or "default"...',
              valuePlaceholder: 'Multiplier...',
            },
          },
        },
        labels: {
          label: 'Labels',
          type: 'text',
          hidden: true,
          implicitDefault: props.season?.labels ?? {},
        },
      }}
    />
  );
};
