type Promisify<F extends (...args: any) => any> = (
  ...args: Parameters<F>
) => Promise<ReturnType<F>>;

// https://stackoverflow.com/a/61132308
type DeepPartial<T> = T extends object
  ? {
    [P in keyof T]?: DeepPartial<T[P]>;
  }
  : T;

type Position = {
  x: number,
  y: number
};

type Size = {
  width: number,
  height: number
};

type Area = Position & Size;
