type JsonTypes = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'undefined';
// https://github.com/ikr/tv4-formats
type JsonFormat = 'date-object' | 'credit-card-number' | 'date' | 'date-time' | 'duration' | 'time-offset' | 'email' | 'guid' | 'uri' | 'url' | 'undefined';

type TypeOf<T> = T extends string ? 'string'
  : T extends number ? 'number'
    : T extends boolean ? 'boolean'
      : T extends Array<unknown> ? 'array'
        : T extends object ? 'object'
          : T extends null ? 'null'
            : 'undefined';

type JsonArray<T> = T extends (infer U)[] ? {
  minItems?: number,
  uniqueItems?: boolean,
  items?: JsonSchema<U>
} : {};

type JsonObject<T> = T extends object ? {
  required?: (keyof T)[],
  properties?: {
    [P in keyof Required<T>]: JsonSchema<T[P]>
  }
} : {};

export type JsonSchema<T> = {
  type: TypeOf<T> | [TypeOf<T>, ...JsonTypes[]],
  format?: JsonFormat | JsonFormat[],
} & JsonObject<T> & JsonArray<T>;
