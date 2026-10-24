import { For, type JSX, Show } from 'solid-js';
import { Button } from '#components/Button';
import { DateInput } from '#components/DateInput';
import { DesktopOnly } from '#components/DesktopOnly';
import { Dropdown } from '#components/Dropdown';
import { MobileOnly } from '#components/MobileOnly';
import { Widget } from '#components/Widget';
import { usePlayerLookup, useTableLookup } from '#flib/entityLookup';
import { useLeagueTimeZone } from '#flib/leagueTimeZone';
import { isMobile } from '#flib/utils';
import { addZonedDays } from '#shared/timeUtils';
import {
  type MatchFilters,
  type MatchStatus,
  MatchStatuses,
} from '#shared/types/api/match';
import style from './MatchFilterWidget.module.scss';

export interface MatchFilterWidgetProps {
  value: MatchFilters;
  onChange: (filters: MatchFilters) => void;

  actions?: JSX.Element;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

const MatchFilterStatusLabels: Record<MatchStatus, string> = {
  SCHEDULED: 'Scheduled',
  ONGOING: 'Ongoing',
  PAUSED: 'Paused',
  FINISHED: 'Finished',
  SURRENDERED: 'Surrendered',
  CANCELED: 'Cancelled',
};

const ANY_VALUE = '';

export const MatchFilterWidget: Component<MatchFilterWidgetProps> = (props) => {
  const tables = useTableLookup();
  const players = usePlayerLookup();
  const timeZone = useLeagueTimeZone();

  const statuses = () => props.value.status ?? [];

  const hasFilters = () =>
    statuses().length > 0 ||
    props.value.tableUuid !== undefined ||
    props.value.playerUuid !== undefined ||
    props.value.from !== undefined ||
    props.value.to !== undefined;

  const update = (patch: Partial<MatchFilters>) => {
    props.onChange({ ...props.value, ...patch });
  };

  const toggleStatus = (status: MatchStatus) => {
    const next = statuses().includes(status)
      ? statuses().filter((current) => current !== status)
      : [...statuses(), status];

    update({ status: next.length > 0 ? next : undefined });
  };

  const tableOptions = () => [
    { label: 'Any table', value: ANY_VALUE },
    ...tables.all().map((table) => ({ label: table.name, value: table.uuid })),
  ];

  const playerOptions = () => [
    { label: 'Any player', value: ANY_VALUE },
    ...players
      .all()
      .map((player) => ({ label: player.name, value: player.uuid })),
  ];

  return (
    <Widget
      classList={{
        [style.widget]: true,
        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
      topLeftLabels="Filters"
      topRightLabels={
        <Show when={hasFilters()}>
          <Button
            type="button"
            severity="secondary"
            onClick={() => props.onChange({})}
          >
            Clear
          </Button>
        </Show>
      }
      bottomRightLabels={props.actions}
    >
      <DesktopOnly>
        <div class={style.statuses}>
          <span class={style.label}>Status:</span>
          <span class={style.chips}>
            <For each={MatchStatuses}>
              {(status) => (
                <Button
                  type="button"
                  severity="secondary"
                  padding={0}
                  aria-pressed={statuses().includes(status)}
                  classList={{
                    [style.status]: true,
                    [style.selected]: statuses().includes(status),
                  }}
                  onClick={() => toggleStatus(status)}
                >
                  {MatchFilterStatusLabels[status]}
                </Button>
              )}
            </For>
          </span>
        </div>
      </DesktopOnly>

      <div
        classList={{
          [style.container]: true,
          [style.mobile]: isMobile(),
        }}
      >
        <MobileOnly>
          <span class={style.label}>Status:</span>
          <Dropdown
            ariaLabel="Status"
            placeholder="Any status"
            multiple
            options={MatchStatuses.map((status) => ({
              label: MatchFilterStatusLabels[status],
              value: status,
            }))}
            value={statuses()}
            onChange={(values) =>
              update({ status: values.length > 0 ? values : undefined })
            }
          />
        </MobileOnly>

        <span class={style.label}>Table:</span>
        <Dropdown
          ariaLabel="Table"
          searchable
          options={tableOptions()}
          value={props.value.tableUuid ?? ANY_VALUE}
          onChange={(value) =>
            update({ tableUuid: value === ANY_VALUE ? undefined : value })
          }
        />

        <span class={style.label}>Player:</span>
        <Dropdown
          ariaLabel="Player"
          searchable
          options={playerOptions()}
          value={props.value.playerUuid ?? ANY_VALUE}
          onChange={(value) =>
            update({ playerUuid: value === ANY_VALUE ? undefined : value })
          }
        />

        <span class={style.label}>From:</span>
        <DateInput
          class={style.date}
          dateMode="date"
          timeZone={timeZone()}
          value={
            props.value.from === undefined ? null : new Date(props.value.from)
          }
          onInput={(date) => update({ from: date?.getTime() })}
        />

        <span class={style.label}>To:</span>
        <DateInput
          class={style.date}
          dateMode="date"
          timeZone={timeZone()}
          value={
            props.value.to === undefined
              ? null
              : addZonedDays(props.value.to, -1, timeZone())
          }
          onInput={(date) =>
            update({
              to:
                date === null
                  ? undefined
                  : addZonedDays(date, 1, timeZone()).getTime(),
            })
          }
        />
      </div>
    </Widget>
  );
};
