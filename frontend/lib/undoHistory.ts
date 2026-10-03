import { type Accessor, batch, createSignal, type Setter } from 'solid-js';

export interface UndoHistory<T> {
  canUndo: Accessor<boolean>;
  canRedo: Accessor<boolean>;

  commit: (next: T) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;

  beginTransaction: () => void;
  endTransaction: () => void;
  cancelTransaction: () => void;
  getTransactionBase: () => T | null;
}

const UNDO_HISTORY_LIMIT = 100;

export function createUndoHistory<T>(
  value: Accessor<T>,
  setValue: (value: T) => void,
): UndoHistory<T> {
  const [past, setPast] = createSignal<T[]>([]);
  const [future, setFuture] = createSignal<T[]>([]);

  let transactionBase: T | null = null;

  const record = (snapshot: T) => {
    setPast((entries) => [...entries, snapshot].slice(-UNDO_HISTORY_LIMIT));
    setFuture([]);
  };

  const commit = (next: T) => {
    batch(() => {
      if (transactionBase === null) record(value());

      setValue(next);
    });
  };

  const beginTransaction = () => {
    transactionBase ??= value();
  };

  const endTransaction = () => {
    if (transactionBase === null) return;

    const base = transactionBase;

    transactionBase = null;

    if (base !== value()) record(base);
  };

  const travel = (
    from: Accessor<T[]>,
    setFrom: Setter<T[]>,
    setTo: Setter<T[]>,
  ) => {
    endTransaction();

    const target = from().at(-1);

    if (target === undefined) return;

    batch(() => {
      setFrom((entries) => entries.slice(0, -1));
      setTo((entries) => [...entries, value()]);
      setValue(target);
    });
  };

  const reset = () => {
    transactionBase = null;

    batch(() => {
      setPast([]);
      setFuture([]);
    });
  };

  return {
    canUndo: () => past().length > 0,
    canRedo: () => future().length > 0,

    commit,
    undo: () => travel(past, setPast, setFuture),
    redo: () => travel(future, setFuture, setPast),
    reset,

    beginTransaction,
    endTransaction,
    cancelTransaction: () => {
      transactionBase = null;
    },
    getTransactionBase: () => transactionBase,
  };
}
