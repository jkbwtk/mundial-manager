/* eslint-disable @typescript-eslint/no-empty-function */


export default class Deferred<T> {
  public promise: Promise<T>;
  public resolve: (value: T | PromiseLike<T>) => void = () => {};
  public reject: (reason?: Error) => void = () => {};

  public resolved = false;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = (value: T | PromiseLike<T>) => {
        this.resolved = true;
        resolve(value);
      };
      this.reject = reject;
    });
  }
}
