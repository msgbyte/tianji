type NestedSwapDatesWithStrings<T> = {
  [k in keyof T]: T[k] extends Date | undefined
    ? string
    : T[k] extends object
      ? NestedSwapDatesWithStrings<T[k]>
      : T[k];
};

export type Serialize<T> = NestedSwapDatesWithStrings<T>;
