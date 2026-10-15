import type { FormField } from '#components/Form';
import { ModalForm, type ModalFormLabels } from '#components/ModalForm';
import { actionCreateSeason, actionUpdateSeason } from '#flib/trpcCalls';
import { msToSeconds, secondsToMs } from '#shared/timeUtils';
import {
  type Season,
  type SeasonConfig,
  SeasonCreate,
  SeasonUpdate,
} from '#shared/types/api/season';
import style from './SeasonCreatorModal.module.scss';

export interface SeasonCreatorModalProps {
  season?: Season;
}

export const seasonCreatorConfigFields: Omit<
  { [Key in keyof SeasonConfig]: FormField<SeasonConfig[Key]> },
  'goalTypes'
> = {
  resetRatings: {
    label: 'Reset Ratings',
    type: 'checkbox',
  },
  sessionGap: {
    label: 'Session Gap',
    placeholder: 'Session gap...',
    type: 'number',
    unit: 's',
    min: 0,
    transform: secondsToMs,
    format: msToSeconds,
  },
  rules: {
    label: 'Match Rules',
    type: 'object',
    fields: {
      target: {
        label: 'Target Score',
        placeholder: 'Target score...',
        type: 'number',
        min: 1,
      },
      winByTwo: {
        label: 'Win By Two',
        type: 'checkbox',
      },
    },
  },
  stylePoints: {
    label: 'Style Points',
    type: 'object',
    fields: {
      streaks: {
        label: 'Streak Bonuses',
        type: 'record',
        keyPlaceholder: 'Goals in a row...',
        valuePlaceholder: 'Points...',
      },
      comebacks: {
        label: 'Comeback Bonuses',
        type: 'record',
        keyPlaceholder: 'Deficit...',
        valuePlaceholder: 'Points...',
      },
    },
  },
  ratings: {
    label: 'Ratings',
    type: 'object',
    fields: {
      ELO: {
        label: 'Elo',
        type: 'object',
        fields: {
          enabled: {
            label: 'Enabled',
            type: 'checkbox',
          },
          defaultRating: {
            label: 'Default Rating',
            placeholder: 'Default rating...',
            type: 'number',
          },
          kFactorRanges: {
            label: 'K-Factor Ranges',
            type: 'record',
            keyPlaceholder: 'Bound or "default"...',
            valuePlaceholder: 'K-factor...',
          },
          scoreMultipliers: {
            label: 'Score Multipliers',
            type: 'record',
            keyPlaceholder: 'Diff or "default"...',
            valuePlaceholder: 'Multiplier...',
          },
        },
      },
      GLICKO2: {
        label: 'Glicko-2',
        type: 'object',
        fields: {
          enabled: {
            label: 'Enabled',
            type: 'checkbox',
          },
          defaultRating: {
            label: 'Default Rating',
            placeholder: 'Default rating...',
            type: 'number',
          },
          defaultRd: {
            label: 'Default RD',
            placeholder: 'Default RD...',
            type: 'number',
          },
          defaultVolatility: {
            label: 'Default Volatility',
            placeholder: 'Default volatility...',
            type: 'number',
            step: 'any',
          },
          tau: {
            label: 'Tau',
            placeholder: 'Tau...',
            type: 'number',
            step: 'any',
          },
        },
      },
    },
  },
};

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
            ...seasonCreatorConfigFields,
            goalTypes: {
              label: 'Goal Types',
              type: 'text',
              hidden: true,
              implicitDefault: props.season?.config.goalTypes ?? {},
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
