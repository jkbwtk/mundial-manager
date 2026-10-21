import { createAsync } from '@solidjs/router';
import { Show } from 'solid-js';
import type { FormField } from '#components/Form';
import { ModalForm, type ModalFormLabels } from '#components/ModalForm';
import { useGoalTypeLookup } from '#flib/entityLookup';
import {
  actionCreateSeason,
  actionUpdateSeason,
  queryActiveLeague,
} from '#flib/trpcCalls';
import {
  formatGoalTypeLabel,
  getSeasonGoalTypes,
  sortGoalTypeTree,
} from '#shared/goalTypes';
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
      SKILL: {
        label: 'Skill',
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
          driftPerDay: {
            label: 'Drift Per Day',
            placeholder: 'Drift per day...',
            type: 'number',
            step: 'any',
          },
          goalWeight: {
            label: 'Goal Weight',
            placeholder: 'Goal weight...',
            type: 'number',
            step: 'any',
          },
          extraPlayerAdvantage: {
            label: 'Extra Player Advantage',
            placeholder: 'Extra player advantage...',
            type: 'number',
          },
          tolerance: {
            label: 'Tolerance',
            placeholder: 'Tolerance...',
            type: 'number',
            step: 'any',
          },
          maxSweeps: {
            label: 'Max Sweeps',
            placeholder: 'Max sweeps...',
            type: 'number',
            min: 1,
          },
          conservativeDeviations: {
            label: 'Conservative Deviations',
            placeholder: 'Conservative deviations...',
            type: 'number',
            step: 'any',
            min: 0,
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

  const league = createAsync(() => queryActiveLeague());
  const goalTypes = useGoalTypeLookup();

  const getConfig = (config: SeasonConfig | undefined) =>
    config && {
      ...config,
      goalTypes: getSeasonGoalTypes(goalTypes.all(), config.goalTypes),
    };

  const goalTypeFields = () =>
    Object.fromEntries(
      sortGoalTypeTree(goalTypes.all()).map(
        (goalType): [string, FormField<SeasonConfig['goalTypes'][string]>] => [
          goalType.uuid,
          {
            label: formatGoalTypeLabel(goalType),
            type: 'object',
            fields: {
              enabled: {
                label: 'Enabled',
                type: 'checkbox',
              },
              stylePoints: {
                label: 'Style Points',
                placeholder: 'Style points...',
                type: 'number',
                min: 0,
              },
            },
          },
        ],
      ),
    );

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
    <Show when={league()}>
      {(league) => (
        <ModalForm
          class={style.modal}
          instance={
            props.season === undefined
              ? undefined
              : { ...props.season, config: getConfig(props.season.config) }
          }
          initialValues={
            isCreating
              ? { config: getConfig(league().seasonConfig) }
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
                ...seasonCreatorConfigFields,
                goalTypes: {
                  label: 'Goal Types',
                  type: 'object',
                  fields: goalTypeFields(),
                },
              },
            },
            labels: {
              label: 'Labels',
              type: 'record',
              hidden: false,
              implicitDefault: props.season?.labels ?? {},
              keyPlaceholder: 'Label...',
              valuePlaceholder: 'Value...',
            },
          }}
        />
      )}
    </Show>
  );
};
