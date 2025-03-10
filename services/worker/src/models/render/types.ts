export type Position = {
  x: number,
  y: number
};

export type Size = {
  width: number,
  height: number
};

export type Area = Position & Size;

export type Margin = {
  vertical: number,
  horizontal: number,
};
