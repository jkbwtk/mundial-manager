import { TRPCError } from '@trpc/server';

export class HttpError extends Error {
  public status: number;
  public trpcCode: TRPCError['code'];

  public constructor(
    message: string,
    status: number,
    trpcCode: TRPCError['code'],
    options?: ErrorOptions,
  ) {
    super(message, options);

    this.name = 'HttpError';
    this.status = status;
    this.trpcCode = trpcCode;
  }

  public toTRPCError() {
    return new TRPCError({
      code: this.trpcCode,
      message: this.message,
      cause: this,
    });
  }
}

export class InsecureConnectionError extends HttpError {
  public constructor(host: string) {
    super(
      `Signing in over an unencrypted connection is not allowed for ${host}, use HTTPS`,
      403,
      'FORBIDDEN',
    );

    this.name = 'InsecureConnectionError';
  }
}
