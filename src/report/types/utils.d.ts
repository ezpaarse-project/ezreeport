// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Promisify<F extends (...args: any) => any> = (
  ...args: Parameters<F>
) => Promise<ReturnType<F>>;

// https://stackoverflow.com/a/61132308
type DeepPartial<T> = T extends object
  ? {
    [P in keyof T]?: DeepPartial<T[P]>;
  }
  : T;

type GeneratorParam<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Type extends Record<string, (...args: any[]) => unknown>,
  Key extends keyof Type,
> = Exclude<Parameters<Type[Key]>[0], Record<string, unknown>>;

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
