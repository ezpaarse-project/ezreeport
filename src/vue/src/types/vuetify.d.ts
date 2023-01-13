// Extracted from Vuetify doc (+ added generic types)
export interface DataTableHeader<T, K extends keyof T = keyof T> {
  text: string,
  value: K,
  align?: 'start' | 'center' | 'end',
  sortable?: boolean,
  filterable?: boolean,
  groupable?: boolean,
  divider?: boolean,
  class?: string | string[],
  cellClass?: string | string[],
  width?: string | number,
  filter?: (value: any, search: string, item: T) => boolean,
  sort?: (a: any, b: any) => number
}
