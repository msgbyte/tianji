export type ExactType<T, U extends Partial<T>> = Omit<T, keyof U> & U;

export type PickRequired<T, U extends keyof T> = Omit<T, keyof U> &
  Required<Pick<T, U>>;

export type MaybePromise<TType> = Promise<TType> | TType;
