export type Position = {
  // oxlint-disable-next-line id-length
  x: number;
  // oxlint-disable-next-line id-length
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type Area = Position & Size;

export type Margin = {
  vertical: number;
  horizontal: number;
};
