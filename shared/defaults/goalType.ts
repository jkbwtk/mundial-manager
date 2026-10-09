import type { GoalType } from '#shared/types/api/goalType';
import type { DeepPartial } from '#shared/zod';

export const goalTypeCreateDefaults = {
  stylePoints: 0,
} satisfies DeepPartial<GoalType>;

export const defaultGoalTypes: Omit<GoalType, 'uuid' | 'parentUuid'>[] = [
  {
    key: 'AERIAL_GOAL',
    name: 'Aerial',
    description:
      'Scored by bouncing the ball off the rod or another non-figurine part of the table',
    icon: '🚀',
    stylePoints: 100,
    labels: {},
  },
  {
    key: 'BACK_STAB_GOAL',
    name: 'Back stab',
    description:
      "Scored by bouncing the ball off the back of the opponent's figurine",
    icon: '🔪',
    stylePoints: 35,
    labels: {},
  },
  {
    key: 'PARRY_GOAL',
    name: 'Parry',
    description: 'Scored by parrying the ball kicked by the opponent',
    icon: '🤺',
    stylePoints: 15,
    labels: {},
  },
  {
    key: 'RETURN_TO_FIELD_GOAL',
    name: 'Return to field',
    description: 'The ball returns to the field after crossing the goal line',
    icon: '↩️',
    stylePoints: 125,
    labels: {},
  },
  {
    key: 'TRICK_SHOT_GOAL',
    name: 'Trick shot',
    description:
      'Scored with a trick shot, such as bouncing the ball off multiple figurines or the table',
    icon: '🎩',
    stylePoints: 30,
    labels: {},
  },
  {
    key: 'LONG_SHOT_GOAL',
    name: 'Long shot',
    description: 'Scored from a long distance',
    icon: '🎯',
    stylePoints: 10,
    labels: {},
  },
  {
    key: 'SLOW_GOAL',
    name: 'Slow',
    description:
      'Scored by slowly kicking the ball in, catching the opponent off guard',
    icon: '🐢',
    stylePoints: 35,
    labels: {},
  },
  {
    key: 'FAST_GOAL',
    name: 'Fast',
    description:
      'Scored by quickly kicking the ball in, overwhelming the opponent',
    icon: '⚡',
    stylePoints: 25,
    labels: {},
  },
  {
    key: 'GUARD_PIERCE_GOAL',
    name: 'Guard pierce',
    description: "Spun the opponent's unheld or weakly held rod out of the way",
    icon: '🛡️',
    stylePoints: 40,
    labels: {},
  },
  {
    key: 'PUSH_GOAL',
    name: 'Push',
    description:
      'Pushed the ball in without any audible sound or noticeable movement',
    icon: '🥷',
    stylePoints: 50,
    labels: {},
  },
  {
    key: 'BERMUDA_TRIANGLE_GOAL',
    name: 'Bermuda triangle',
    description:
      "Scored directly after the ball hits the goalposts of the scoring side's goal",
    icon: '📐',
    stylePoints: 175,
    labels: {},
  },
  {
    key: 'RICOCHET_GOAL',
    name: 'Ricochet',
    description:
      "Scored by ricocheting the ball off the table's side and/or multiple figurines",
    icon: '⤴️',
    stylePoints: 25,
    labels: {},
  },
];
