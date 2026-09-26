import { STATUS_CODES } from 'node:http';
import Cookies from 'cookies';
import type {
  ErrorRequestHandler,
  RequestHandler,
} from 'express-serve-static-core';
import onFinished from 'on-finished';
import onHeaders from 'on-headers';
import z from 'zod';
import { HttpError } from '#backend/errors/http';
import { getJWTContextFromCookies } from '#blib/jwt';
import { logger } from '#shared/logger';
import type { PageError } from '#shared/pageError';

declare global {
  namespace Express {
    interface Response {
      requestStart: number;
      responseTime?: number;
    }
  }
}

export type ErrorPageRenderer = (pageError: PageError) => Promise<string>;

export interface ErrorMiddlewareOptions {
  renderErrorPage?: ErrorPageRenderer;
  exposeDetails?: boolean;
}

const ErrorStatus = z.int().min(400).max(599);

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

export function getErrorStatus(err: unknown): number {
  if (!(err instanceof Object)) return 500;

  const { status, statusCode } = err as {
    status?: unknown;
    statusCode?: unknown;
  };

  return (
    ErrorStatus.safeParse(status).data ??
    ErrorStatus.safeParse(statusCode).data ??
    500
  );
}

export function createErrorMiddleware(
  options: ErrorMiddlewareOptions = {},
): ErrorRequestHandler {
  return async (err, req, res, next) => {
    if (res.headersSent) {
      next(err);

      return;
    }

    const isHttpError = err instanceof HttpError;
    const status = getErrorStatus(err);
    const meta = { label: ['http', `${status}`], error: err };

    if (status >= 500) {
      logger.error('Request failed: %s %s', req.method, req.path, meta);
    } else {
      logger.warn('Request failed: %s %s', req.method, req.path, meta);
    }

    if (options.renderErrorPage && req.accepts(['json', 'html']) === 'html') {
      try {
        const html = await options.renderErrorPage({
          status,
          message: isHttpError ? err.message : 'Something went wrong',
          error:
            options.exposeDetails && err instanceof Error ? err : undefined,
        });

        res.status(status).set({ 'Content-Type': 'text/html' }).send(html);

        return;
      } catch (renderError) {
        logger.error('Failed to render the error page', {
          label: ['http', 'error-page'],
          error: renderError,
        });
      }
    }

    res
      .status(status)
      .set({
        'Content-Type': 'application/json',
      })
      .json({
        error: isHttpError
          ? err.message
          : (STATUS_CODES[status] ?? 'Internal Server Error'),
      });
  };
}

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
