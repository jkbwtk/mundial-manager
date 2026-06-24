import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import objectSupport from 'dayjs/plugin/objectSupport';
import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  mergeProps,
  on,
  onMount,
  Show,
  splitProps,
} from 'solid-js';
import { isServer } from 'solid-js/web';
import { AnchoredPopup } from '#components/AnchoredPopup';
import { SegmentInput } from '#components/DateInput';
import { MaterialSymbol } from '#components/MaterialSymbol';
import {
  applyDirectives,
  type ComponentUseDirectiveHack,
} from '#flib/solidHelpers';
import { clamp, type RequiredDefaults } from '#shared/utils';
import style from './DateInput.module.scss';

dayjs.extend(objectSupport);
dayjs.extend(isoWeek);

type CalCell = {
  dayNumber: number;
  isCurrentMonth: boolean;
  date: Date;
};

export const DateModes = ['date', 'dateTime', 'dateTimeSeconds'] as const;

export type DateMode = (typeof DateModes)[number];

export type DateInputProps = {
  invalid?: boolean;
  value?: Date | null;
  dateMode?: DateMode;
  onInput?: (value: Date | null) => void;
  disabled?: boolean;
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
  useDirectives?: ComponentUseDirectiveHack<HTMLInputElement>[];
  name?: string;
};

const MonthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export const dateInputDefaultProps: RequiredDefaults<DateInputProps> = {
  invalid: false,
  value: null,
  dateMode: 'date',
  onInput: () => {},
  disabled: false,
  class: '',
  classList: {},
  useDirectives: [],
  name: undefined!,
};

const daysInMonth = (year: number, month: number) =>
  dayjs({ year, month: month - 1 }).daysInMonth();

const isoWeekday = (year: number, month: number, day: number) =>
  dayjs({ year, month: month - 1, day }).isoWeekday();

const buildGrid = (year: number, month: number): CalCell[] => {
  const totalDays = daysInMonth(year, month);
  const firstWeekday = isoWeekday(year, month, 1) - 1;

  const cells: CalCell[] = [];

  for (let day = 1 - firstWeekday; day <= 42 - firstWeekday; day += 1) {
    const date = new Date(year, month - 1, day);
    const isCurrentMonth = day >= 1 && day <= totalDays;

    cells.push({
      dayNumber: date.getDate(),
      isCurrentMonth,
      date: date,
    });
  }

  return cells;
};

const clampAndPad = (value: string, min: number, max: number, pad = 2) =>
  value ? String(clamp(min, max, Number(value))).padStart(pad, '0') : '';

const segmentClamps = {
  year: (value) => clampAndPad(value, 1, 9999, 4),
  month: (value) => clampAndPad(value, 1, 12, 2),
  day: (value, maxOverride?: number) =>
    clampAndPad(value, 1, maxOverride ?? 31, 2),
  hour: (value) => clampAndPad(value, 0, 23, 2),
  minute: (value) => clampAndPad(value, 0, 59, 2),
  second: (value) => clampAndPad(value, 0, 59, 2),
} satisfies Record<string, (value: string, maxOverride?: number) => string>;

const parseDate = (date: Date) => ({
  year: String(date.getFullYear()).padStart(4, '0'),
  month: String(date.getMonth() + 1).padStart(2, '0'),
  day: String(date.getDate()).padStart(2, '0'),
  hour: String(date.getHours()).padStart(2, '0'),
  minute: String(date.getMinutes()).padStart(2, '0'),
  second: String(date.getSeconds()).padStart(2, '0'),
});

const TodayDate = new Date().toDateString();

export const DateInput: Component<DateInputProps> = (userProps) => {
  const baseProps = mergeProps(dateInputDefaultProps, userProps);
  const [containerProps, props] = splitProps(baseProps, ['name']);

  let yearRef!: HTMLInputElement;
  let monthRef!: HTMLInputElement;
  let dayRef!: HTMLInputElement;
  let hourRef!: HTMLInputElement;
  let minuteRef!: HTMLInputElement;
  let secondRef!: HTMLInputElement;

  if (!isServer) {
    hourRef = document.createElement('input');
    minuteRef = document.createElement('input');
    secondRef = document.createElement('input');
  }

  let triggerRef!: HTMLButtonElement;
  let calRef!: HTMLDivElement;
  let wrapRef!: HTMLSpanElement;

  const [open, setOpen] = createSignal(false);
  const [focusIdx, setFocusIdx] = createSignal(-1);

  const [selectedDate, setSelectedDate] = createSignal(props.value ?? null);

  const [viewYear, setViewYear] = createSignal(
    (selectedDate() ?? new Date()).getFullYear(),
  );
  const [viewMonth, setViewMonth] = createSignal(
    (selectedDate() ?? new Date()).getMonth() + 1,
  );

  const grid = createMemo(() => buildGrid(viewYear(), viewMonth()));

  const emitFromRefs = () => {
    if (props.dateMode === 'date') {
      hourRef.value = '0';
      minuteRef.value = '0';
    }

    if (props.dateMode !== 'dateTimeSeconds') {
      secondRef.value = '0';
    }

    if (
      !yearRef.value ||
      !monthRef.value ||
      !dayRef.value ||
      !hourRef.value ||
      !minuteRef.value ||
      !secondRef.value
    ) {
      batch(() => {
        setSelectedDate(null);
        props.onInput(null);

        wrapRef.oninput?.(new InputEvent('input', { bubbles: true }));
      });

      return;
    }

    const dateString = `${segmentClamps.year(yearRef.value)}-${segmentClamps.month(monthRef.value)}-${segmentClamps.day(dayRef.value)}T${segmentClamps.hour(hourRef.value)}:${segmentClamps.minute(minuteRef.value)}:${segmentClamps.second(secondRef.value)}`;

    const date = new Date(dateString);

    batch(() => {
      setSelectedDate(date);
      props.onInput(date);

      wrapRef.oninput?.(new InputEvent('input', { bubbles: true }));
    });
  };

  const syncFieldsFromValue = (date: Date | null) => {
    setSelectedDate(date);

    props.onInput(date);
    wrapRef.oninput?.(new InputEvent('input', { bubbles: true }));

    if (!date) {
      yearRef.value = '';
      monthRef.value = '';
      dayRef.value = '';
      hourRef.value = '';
      minuteRef.value = '';
      secondRef.value = '';
      return;
    }

    const { year, month, day, hour, minute, second } = parseDate(date);
    const active = document.activeElement;

    if (active !== yearRef) yearRef.value = year;
    if (active !== monthRef) monthRef.value = month;
    if (active !== dayRef) dayRef.value = day;
    if (active !== hourRef) hourRef.value = hour;
    if (active !== minuteRef) minuteRef.value = minute;
    if (active !== secondRef) secondRef.value = second;
  };

  const moveTo = (element: HTMLInputElement, position: 'start' | 'end') => {
    element.focus();

    const p = position === 'start' ? 0 : element.value.length;
    element.setSelectionRange(p, p);
  };

  const currentDaysInMonth = () =>
    daysInMonth(
      Number(yearRef.value) || new Date().getFullYear(),
      Number(monthRef.value) || 1,
    );

  const makeSegmentKeys = (
    maxLength: number,
    prevSegment: () => HTMLInputElement | null,
    nextSegment: () => HTMLInputElement | null,
    validate?: (filledValue: string) => string,
  ) => {
    const applyDigit = (
      input: HTMLInputElement,
      selStart: number,
      digit: string,
    ) => {
      input.value =
        input.value.length < maxLength
          ? `${input.value.slice(0, selStart)}${digit}${input.value.slice(selStart)}`
          : digit;

      if (validate && input.value.length >= maxLength) {
        input.value = validate(input.value);
      }

      const newCursorPos = selStart + 1;
      input.setSelectionRange(newCursorPos, newCursorPos);

      emitFromRefs();

      if (newCursorPos >= maxLength) {
        const nextInput = nextSegment();
        if (nextInput) {
          nextInput.focus();
          nextInput.setSelectionRange(0, 0);
        }
      }
    };

    const applyBackspace = (
      input: HTMLInputElement,
      selStart: number,
      selEnd: number,
    ) => {
      if (selStart < selEnd) {
        input.value =
          input.value.slice(0, selStart) + input.value.slice(selEnd);
        input.setSelectionRange(selStart, selStart);
        emitFromRefs();
      } else if (selStart > 0) {
        input.value =
          input.value.slice(0, selStart - 1) + input.value.slice(selStart);
        input.setSelectionRange(selStart - 1, selStart - 1);
        emitFromRefs();
      } else {
        prevSegment()?.focus();
      }
    };

    const applyDelete = (
      input: HTMLInputElement,
      selStart: number,
      selEnd: number,
    ) => {
      if (selStart < selEnd) {
        input.value =
          input.value.slice(0, selStart) + input.value.slice(selEnd);
        input.setSelectionRange(selStart, selStart);
      } else if (selStart < input.value.length) {
        input.value =
          input.value.slice(0, selStart) + input.value.slice(selStart + 1);
        input.setSelectionRange(selStart, selStart);
      }
      emitFromRefs();
    };

    const applyLeft = (
      input: HTMLInputElement,
      selStart: number,
      selEnd: number,
    ) => {
      if (selStart <= 0 && selStart === selEnd) {
        const prevInput = prevSegment();
        if (prevInput) moveTo(prevInput, 'end');
      } else {
        input.setSelectionRange(
          Math.max(0, selStart - 1),
          Math.max(0, selStart - 1),
        );
      }
    };

    const applyRight = (
      input: HTMLInputElement,
      selStart: number,
      selEnd: number,
    ) => {
      if (selEnd >= input.value.length && selStart === selEnd) {
        const nextInput = nextSegment();
        if (nextInput) moveTo(nextInput, 'start');
      } else {
        const nextPos = Math.min(input.value.length, selEnd + 1);
        input.setSelectionRange(nextPos, nextPos);
      }
    };

    return (e: KeyboardEvent) => {
      if (e.key === 'Tab') return;
      e.preventDefault();

      const input = e.currentTarget as HTMLInputElement;
      const selStart = input.selectionStart ?? 0;
      const selEnd = input.selectionEnd ?? selStart;

      if (/^\d$/.test(e.key)) applyDigit(input, selStart, e.key);
      else if (e.key === 'Backspace') applyBackspace(input, selStart, selEnd);
      else if (e.key === 'Delete') applyDelete(input, selStart, selEnd);
      else if (e.key === 'ArrowLeft') applyLeft(input, selStart, selEnd);
      else if (e.key === 'ArrowRight') applyRight(input, selStart, selEnd);
    };
  };

  const yearKeys = makeSegmentKeys(
    4,
    () => null,
    () => monthRef,
    segmentClamps.year,
  );
  const monthKeys = makeSegmentKeys(
    2,
    () => yearRef,
    () => dayRef,
    segmentClamps.month,
  );
  const dayKeys = makeSegmentKeys(
    2,
    () => monthRef,
    () => (props.dateMode === 'date' ? null : hourRef),
    (value) => segmentClamps.day(value, currentDaysInMonth()),
  );
  const hourKeys = makeSegmentKeys(
    2,
    () => dayRef,
    () => minuteRef,
    segmentClamps.hour,
  );
  const minuteKeys = makeSegmentKeys(
    2,
    () => hourRef,
    () => (props.dateMode === 'dateTimeSeconds' ? secondRef : null),
    segmentClamps.minute,
  );
  const secondKeys = makeSegmentKeys(
    2,
    () => minuteRef,
    () => null,
    segmentClamps.second,
  );

  const stepMonth = (delta: number) => {
    const targetMonth = dayjs({ year: viewYear(), month: viewMonth() - 1 }).add(
      delta,
      'month',
    );

    setViewYear(targetMonth.year());
    setViewMonth(targetMonth.month() + 1);
    setFocusIdx(-1);
  };

  const openCal = () => {
    const current = selectedDate() ?? new Date();

    setViewYear(current.getFullYear());
    setViewMonth(current.getMonth() + 1);

    setFocusIdx(-1);
    setOpen(true);
  };

  const closeCal = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef?.focus();
  };

  const selectDate = (date: Date) => {
    syncFieldsFromValue(date);
    props.onInput(date);
    closeCal();
  };

  const handleClickOutside = () => {
    closeCal(false);
  };

  const handleCalKeyDown = (e: KeyboardEvent) => {
    const cells = grid();
    const curIdx = focusIdx();

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        closeCal();

        break;
      case 'ArrowRight':
        e.preventDefault();

        if (curIdx < 0) {
          setFocusIdx(0);
          break;
        }

        if (curIdx + 1 >= cells.length) {
          stepMonth(1);
          setFocusIdx(0);
        } else setFocusIdx(curIdx + 1);

        break;
      case 'ArrowLeft':
        e.preventDefault();

        if (curIdx <= 0) {
          stepMonth(-1);
          setFocusIdx(grid().length - 1);
        } else setFocusIdx(curIdx - 1);

        break;
      case 'ArrowDown':
        e.preventDefault();

        if (curIdx < 0) {
          setFocusIdx(0);
          break;
        }

        if (curIdx + 7 >= cells.length) {
          stepMonth(1);
          setFocusIdx((curIdx + 21) % cells.length);
        } else setFocusIdx(curIdx + 7);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (curIdx < 7) {
          stepMonth(-1);
          setFocusIdx(grid().length - 21 + curIdx);
        } else setFocusIdx(curIdx - 7);
        break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const cell = cells[focusIdx()];
        if (cell) selectDate(cell.date);
        break;
      }
    }
  };

  createEffect(
    on(
      () => props.value,
      (newDate) => {
        syncFieldsFromValue(newDate);
      },
      { defer: true },
    ),
  );

  createEffect(
    on(focusIdx, (idx) => {
      if (!open() || idx < 0) return;
      requestAnimationFrame(() => {
        calRef
          ?.querySelectorAll<HTMLButtonElement>('[data-cell]')
          [idx]?.focus();
      });
    }),
  );

  onMount(() => {
    // @ts-expect-error
    wrapRef.setCustomValidity = () => {};
    // @ts-expect-error
    wrapRef.checkValidity = () => true;

    wrapRef.focus = (options: FocusOptions) => {
      yearRef.focus(options);
    };

    // @ts-expect-error
    applyDirectives(wrapRef, props.useDirectives);
  });

  const handleSegmentBlur = (ev: FocusEvent) => {
    if (
      ev.relatedTarget instanceof HTMLElement &&
      triggerRef &&
      triggerRef.contains(ev.relatedTarget)
    ) {
      return;
    }

    if (
      ev.relatedTarget === yearRef ||
      ev.relatedTarget === monthRef ||
      ev.relatedTarget === dayRef ||
      ev.relatedTarget === hourRef ||
      ev.relatedTarget === minuteRef ||
      ev.relatedTarget === secondRef
    ) {
      return;
    }

    wrapRef.onblur?.(ev);
  };

  return (
    <span
      ref={wrapRef}
      classList={{
        [style.dateInput]: true,
        [style.invalid]: !!props.invalid,
        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
      // @ts-expect-error
      prop:type="date"
      prop:name={containerProps.name}
      prop:value={selectedDate()}
    >
      <SegmentInput
        ref={(el) => {
          yearRef = el;
        }}
        class={style.year}
        maxlength={4}
        placeholder="YYYY"
        defaultValue={props.value ? parseDate(props.value).year : ''}
        label="Year"
        disabled={props.disabled}
        keys={yearKeys}
        blurClamp={segmentClamps.year}
        onEmit={emitFromRefs}
        onBlur={handleSegmentBlur}
      />

      <span aria-hidden="true">-</span>

      <SegmentInput
        ref={(el) => {
          monthRef = el;
        }}
        class={style.month}
        maxlength={2}
        placeholder="MM"
        defaultValue={props.value ? parseDate(props.value).month : ''}
        label="Month"
        disabled={props.disabled}
        keys={monthKeys}
        blurClamp={segmentClamps.month}
        onEmit={emitFromRefs}
        onBlur={handleSegmentBlur}
      />

      <span aria-hidden="true">-</span>

      <SegmentInput
        ref={(el) => {
          dayRef = el;
        }}
        class={style.day}
        maxlength={2}
        placeholder="DD"
        defaultValue={props.value ? parseDate(props.value).day : ''}
        label="Day"
        disabled={props.disabled}
        keys={dayKeys}
        blurClamp={(rawValue) =>
          segmentClamps.day(rawValue, currentDaysInMonth())
        }
        onEmit={emitFromRefs}
        onBlur={handleSegmentBlur}
      />

      <Show when={props.dateMode !== 'date'}>
        <span aria-hidden="true"> </span>

        <SegmentInput
          ref={(el) => {
            hourRef = el;
          }}
          class={style.day}
          maxlength={2}
          placeholder="HH"
          defaultValue={props.value ? parseDate(props.value).hour : ''}
          label="Hour"
          disabled={props.disabled}
          keys={hourKeys}
          blurClamp={segmentClamps.hour}
          onEmit={emitFromRefs}
          onBlur={handleSegmentBlur}
        />

        <span aria-hidden="true">:</span>

        <SegmentInput
          ref={(el) => {
            minuteRef = el;
          }}
          class={style.day}
          maxlength={2}
          placeholder="mm"
          defaultValue={props.value ? parseDate(props.value).minute : ''}
          label="Minute"
          disabled={props.disabled}
          keys={minuteKeys}
          blurClamp={segmentClamps.minute}
          onEmit={emitFromRefs}
          onBlur={handleSegmentBlur}
        />

        <Show when={props.dateMode === 'dateTimeSeconds'}>
          <span aria-hidden="true">:</span>

          <SegmentInput
            ref={(el) => {
              secondRef = el;
            }}
            class={style.day}
            maxlength={2}
            placeholder="SS"
            defaultValue={props.value ? parseDate(props.value).second : ''}
            label="Second"
            disabled={props.disabled}
            keys={secondKeys}
            blurClamp={segmentClamps.second}
            onEmit={emitFromRefs}
            onBlur={handleSegmentBlur}
          />
        </Show>
      </Show>

      <button
        ref={triggerRef!}
        class={style.trigger}
        type="button"
        aria-label="Open calendar"
        disabled={props.disabled}
        aria-expanded={open()}
        onClick={() => !props.disabled && (open() ? closeCal() : openCal())}
      >
        <MaterialSymbol
          symbol="calendar_month"
          color="primary"
          highlightColor="primary"
          interactive={!props.disabled}
          active={open()}
          filled={open()}
        />
      </button>

      <AnchoredPopup
        class={style.calendar}
        open={open()}
        triggerRef={() => wrapRef}
        onClickOutside={handleClickOutside}
        anchor="middle"
        popupRef={(el) => {
          calRef = el;
        }}
        role="dialog"
        aria-label="Date picker"
        onKeyDown={handleCalKeyDown}
        onWheel={(e: WheelEvent) => {
          e.preventDefault();
          stepMonth(
            e.deltaY > 0
              ? e.shiftKey || e.ctrlKey
                ? 12
                : 1
              : e.shiftKey || e.ctrlKey
                ? -12
                : -1,
          );
        }}
      >
        <div class={style.header}>
          <button
            type="button"
            title="Previous year"
            onClick={() => stepMonth(-12)}
          >
            <MaterialSymbol
              symbol="keyboard_double_arrow_left"
              color="primary"
              highlightColor="primary"
              interactive
            />
          </button>
          <button
            type="button"
            title="Previous month"
            onClick={() => stepMonth(-1)}
          >
            <MaterialSymbol
              symbol="keyboard_arrow_left"
              color="primary"
              highlightColor="primary"
              interactive
            />
          </button>
          <span class={style.title}>
            {MonthNames[viewMonth() - 1]} {viewYear()}
          </span>
          <button type="button" title="Next month" onClick={() => stepMonth(1)}>
            <MaterialSymbol
              symbol="keyboard_arrow_right"
              color="primary"
              highlightColor="primary"
              interactive
            />
          </button>
          <button type="button" title="Next year" onClick={() => stepMonth(12)}>
            <MaterialSymbol
              symbol="keyboard_double_arrow_right"
              color="primary"
              highlightColor="primary"
              interactive
            />
          </button>
        </div>

        <div class={style.grid}>
          <For each={DayNames}>
            {(name) => <span class={style.dayName}>{name}</span>}
          </For>

          <For each={grid()}>
            {(cell, idx) => (
              <button
                type="button"
                data-cell
                tabIndex={-1}
                classList={{
                  [style.dayCell]: true,
                  [style.otherMonth]: !cell.isCurrentMonth,
                  [style.selected]:
                    cell.date.toDateString() === selectedDate()?.toDateString(),
                  [style.today]: cell.date.toDateString() === TodayDate,
                  [style.focused]: idx() === focusIdx(),
                }}
                onPointerUp={() => selectDate(cell.date)}
                onPointerEnter={() => setFocusIdx(idx())}
              >
                {String(cell.dayNumber).padStart(2, '0')}
              </button>
            )}
          </For>
        </div>
      </AnchoredPopup>
    </span>
  );
};
