import type { GoalType } from '#shared/types/api/goalType';

type GoalTypeNode = Pick<GoalType, 'uuid' | 'parentUuid' | 'name' | 'icon'>;

export function formatGoalTypeLabel(
  goalType: Pick<GoalType, 'name' | 'icon'>,
): string {
  return goalType.icon ? `${goalType.icon} ${goalType.name}` : goalType.name;
}

export function sortGoalTypeTree<T extends GoalTypeNode>(goalTypes: T[]): T[] {
  const byName = (a: T, b: T) => a.name.localeCompare(b.name);
  const parents = goalTypes
    .filter((goalType) => !goalType.parentUuid)
    .toSorted(byName);

  return parents.flatMap((parent) => [
    parent,
    ...goalTypes
      .filter((goalType) => goalType.parentUuid === parent.uuid)
      .toSorted(byName),
  ]);
}

export function normalizeGoalTypeSelection(
  previous: string[],
  next: string[],
  goalTypes: GoalTypeNode[],
): string[] {
  const parents = new Map(
    goalTypes.map((goalType) => [goalType.uuid, goalType.parentUuid ?? null]),
  );
  const removed = new Set(previous.filter((uuid) => !next.includes(uuid)));
  const selected = new Set<string>();

  for (const uuid of next) {
    const parentUuid = parents.get(uuid) ?? null;

    if (parentUuid !== null && removed.has(parentUuid)) continue;
    if (parentUuid !== null) selected.add(parentUuid);

    selected.add(uuid);
  }

  return [...selected];
}
