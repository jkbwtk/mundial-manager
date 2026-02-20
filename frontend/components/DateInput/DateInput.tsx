import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import objectSupport from 'dayjs/plugin/objectSupport';
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  mergeProps,
  on,
} from 'solid-js';
import { AnchoredPopup } from '#components/AnchoredPopup';
import { SegmentInput } from '#components/DateInput';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { clamp, type RequiredDefaults } from '#shared/utils';
import style from './DateInput.module.scss';

dayjs.extend(objectSupport);
dayjs.extend(isoWeek);

type CalCell = {
  dayNumber: number;
  isCurrentMonth: boolean;
  date: Date;
};

export type DateInputProps = {
  invalid?: boolean;
  value?: Date | null;
  onInput?: (value: Date) => void;
  disabled?: boolean;
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
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
  onInput: () => {},
  disabled: false,
  class: '',
  classList: {},
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

const parseDate = (date: Date) => ({
  year: String(date.getFullYear()).padStart(4, '0'),
  month: String(date.getMonth() + 1).padStart(2, '0'),
  day: String(date.getDate()).padStart(2, '0'),
});

const TodayDate = new Date().toDateString();

export const DateInput: Component<DateInputProps> = (userProps) => {
  const props = mergeProps(dateInputDefaultProps, userProps);

  let yearRef!: HTMLInputElement;
  let monthRef!: HTMLInputElement;
  let dayRef!: HTMLInputElement;
  let triggerRef!: HTMLButtonElement;
  let calRef!: HTMLDivElement;
  let wrapRef!: HTMLSpanElement;

  const [open, setOpen] = createSignal(false);
  const [focusIdx, setFocusIdx] = createSignal(-1);

  const [viewYear, setViewYear] = createSignal(
    (props.value ?? new Date()).getFullYear(),
  );
  const [viewMonth, setViewMonth] = createSignal(
    (props.value ?? new Date()).getMonth() + 1,
  );

  const grid = createMemo(() => buildGrid(viewYear(), viewMonth()));
  const selectedDateStr = createMemo(() => props.value?.toDateString() ?? null);

  const emitFromRefs = () => {
    if (!yearRef.value || !monthRef.value || !dayRef.value) return;

    const date = new Date(`${yearRef.value}-${monthRef.value}-${dayRef.value}`);
    if (!Number.isNaN(date.getTime())) props.onInput(date);
  };

  const syncFieldsFromValue = (date: Date) => {
    const { year, month, day } = parseDate(date);
    const active = document.activeElement;

    if (active !== yearRef) yearRef.value = year;
    if (active !== monthRef) monthRef.value = month;
    if (active !== dayRef) dayRef.value = day;
  };

  const moveTo = (element: HTMLInputElement, position: 'start' | 'end') => {
    element.focus();

    const p = position === 'start' ? 0 : element.value.length;
    element.setSelectionRange(p, p);
  };

  const clampAndPad = (value: string, min: number, max: number, pad = 2) =>
    value ? String(clamp(min, max, Number(value))).padStart(pad, '0') : '';

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
  );
  const monthKeys = makeSegmentKeys(
    2,
    () => yearRef,
    () => dayRef,
    (value) => clampAndPad(value, 1, 12),
  );
  const dayKeys = makeSegmentKeys(
    2,
    () => monthRef,
    () => null,
    (value) => clampAndPad(value, 1, currentDaysInMonth()),
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
    if (props.value) {
      setViewYear(props.value.getFullYear());
      setViewMonth(props.value.getMonth() + 1);
    }
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
        if (newDate) syncFieldsFromValue(newDate);
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

  return (
    <span
      ref={wrapRef}
      classList={{
        [style.dateInput]: true,
        [style.invalid]: !!props.invalid,
        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
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
        blurClamp={(rawValue) => clampAndPad(rawValue, 1, 9999, 4)}
        onEmit={emitFromRefs}
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
        blurClamp={(rawValue) => clampAndPad(rawValue, 1, 12)}
        onEmit={emitFromRefs}
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
        blurClamp={(rawValue) => clampAndPad(rawValue, 1, currentDaysInMonth())}
        onEmit={emitFromRefs}
      />

      <button
        ref={triggerRef!}
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
                    cell.date.toDateString() === selectedDateStr(),
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
