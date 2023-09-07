// https://stackoverflow.com/a/61132308
type DeepPartial<T> = T extends object
  ? {
    [P in keyof T]?: DeepPartial<T[P]>;
  }
  : T;

/**
 * @deprecated
 */
type ExcludeFirst<T extends unknown[]> = T extends [unknown, ...(infer R)] ? R : [];

type Position = {
  x: number,
  y: number
};

type Size = {
  width: number,
  height: number
};

type Area = Position & Size;
