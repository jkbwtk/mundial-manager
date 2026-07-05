import Cookies from 'cookies';
import type { RequestHandler } from 'express-serve-static-core';
import onFinished from 'on-finished';
import onHeaders from 'on-headers';
import { getJWTContextFromCookies } from '#blib/jwt';
import { logger } from '#shared/logger';

declare global {
  namespace Express {
    interface Response {
      requestStart: number;
      responseTime?: number;
    }
  }
}

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

export const requestLogger: RequestHandler = (req, res, next) => {
  const requestStart = performance.now();

  onHeaders(res, () => {
    res.responseTime = performance.now() - requestStart;
  });

  onFinished(res, (err, ctx) => {
    const totalTime = performance.now() - requestStart;

    if (err) {
      logger.error('Error during request', {
        error: err,
      });
    }

    logger.http({
      method: req.method,
      remoteAddress:
        req.get('X-Forwarded-For') ??
        req.socket.remoteAddress ??
        req.ip ??
        'unknown',
      url: req.originalUrl ?? req.url,
      httpVersion: req.httpVersion,
      referer: req.headers.referer ?? null,
      userAgent: req.get('User-Agent') ?? null,
      statusCode: res.statusCode,
      statusMessage: ctx.statusMessage,
      contentLength: Number.parseInt(ctx.get('Content-Length') ?? '0', 10),
      responseTime: ctx.responseTime ?? 0,
      totalTime,
    });
  });

  next();
};

export const jwtMiddleware: RequestHandler = async (req, res, next) => {
  const cookies = new Cookies(req, res);
  const jwt = await getJWTContextFromCookies(cookies);

  Object.assign(req, { jwt });

  next();
};
