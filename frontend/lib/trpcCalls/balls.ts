import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import { Ball, type BallCreate, type BallUpdate } from '#shared/types/api/ball';
import { PaginatedResponse } from '#shared/zod';

export const queryBalls = query(async () => {
  const balls = await trpcClient.balls.balls.query();

  return PaginatedResponse(Ball).parse(balls);
}, 'queryBalls');

export const actionCreateBall = action(async (ball: BallCreate) => {
  const newBall = await trpcClient.balls.createBall.mutate(ball);

  return json(Ball.parse(newBall), {
    revalidate: ['queryBalls'],
  });
}, 'actionCreateBall');

export const actionUpdateBall = action(async (ball: BallUpdate) => {
  const updatedBall = await trpcClient.balls.updateBall.mutate(ball);

  return json(Ball.parse(updatedBall), {
    revalidate: ['queryBalls', 'queryBallById'],
  });
}, 'actionUpdateBall');

export const actionDeleteBall = action(async (uuid: string) => {
  const deletedBall = await trpcClient.balls.deleteBall.mutate({ uuid });

  return json(Ball.parse(deletedBall), {
    revalidate: ['queryBalls', 'queryBallById'],
  });
}, 'actionDeleteBall');

export const queryBallById = query(async (uuid: string) => {
  const ball = await trpcClient.balls.ballById.query({ uuid });

  return Ball.parse(ball);
}, 'queryBallById');
