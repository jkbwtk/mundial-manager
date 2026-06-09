import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import {
  Ball,
  type BallCreate,
  type BallQueryMeta,
  type BallUpdate,
} from '#shared/types/api/ball';
import { PaginatedResponse } from '#shared/zod';

export const queryBalls = query(async (meta: BallQueryMeta = {}) => {
  const balls = await trpcClient.balls.getAll.query(meta);

  return PaginatedResponse(Ball).parse(balls);
}, 'queryBalls');

export const querySearchBalls = query(async (search: string) => {
  const balls = await trpcClient.balls.search.query(search);

  return Ball.array().parse(balls);
}, 'querySearchBalls');

export const actionCreateBall = action(async (ball: BallCreate) => {
  const newBall = await trpcClient.balls.create.mutate(ball);

  return json(Ball.parse(newBall), {
    revalidate: ['queryBalls'],
  });
}, 'actionCreateBall');

export const actionUpdateBall = action(async (ball: BallUpdate) => {
  const updatedBall = await trpcClient.balls.update.mutate(ball);

  return json(Ball.parse(updatedBall), {
    revalidate: ['queryBalls', 'queryBallById'],
  });
}, 'actionUpdateBall');

export const actionDeleteBall = action(async (uuid: string) => {
  const deletedBall = await trpcClient.balls.delete.mutate({ uuid });

  return json(Ball.parse(deletedBall), {
    revalidate: ['queryBalls', 'queryBallById'],
  });
}, 'actionDeleteBall');

export const queryBallById = query(async (uuid: string) => {
  const ball = await trpcClient.balls.getById.query({ uuid });

  return Ball.parse(ball);
}, 'queryBallById');
