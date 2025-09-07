import Deferred from '#shared/Deferred';
import type { Awaitable } from '#shared/utils';

export class Store {
  public readonly uuid = crypto.randomUUID();
  private readyState = new Deferred<void>();

  public initialize(): Awaitable<void> {
    this.readyState.resolve();
  }

  public async getInitialized(): Promise<this> {
    await this.readyState.promise;

    return this;
  }
}
