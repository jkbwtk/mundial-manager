import type { RequestHandler } from 'express-serve-static-core';

export const notFoundMiddleware: RequestHandler = (_req, res) => {
  res
    .status(404)
    .set({
      'Content-Type': 'application/json',
    })
    .json({
      error: 'Not Found',
    });
};
