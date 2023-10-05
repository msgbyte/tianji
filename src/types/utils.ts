export type ExactType<T, U extends Partial<T>> = Omit<T, keyof U> & U;
