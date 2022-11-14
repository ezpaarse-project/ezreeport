# Reporting Layouts

Contains all possible layout usable by various tasks

## How to write a Layout

- Must export a **default function** (`export default () => []` in TS, `exports.default = () => []` in JS). We'll call it the *main* function. It's a function so you can do things before returning the layout (like checking if data's source is available, or setup options used by all pages)
- The *main* function must returns an **array of functions** (in TS, you can use the type `LayoutFnc` from `models/layouts` to declare your default function) and takes a few parameters.
  - The first one is some info about the task (like the period, the recurrence, etc.)
  - The second one is options from `task.data`. **You want to check that data (with [Joi](https://joi.dev/) for example)**
- Each item of the returned by your *main* function represent a page of the report and **must be a function**. This function **must return an array** of *Figure* or just a *Figure* object. It's a function so you can do things before returning figure(s) (like do some aggregations)
  - A *Figure* have a `type` property (see [Available Figure types](#available-figure-types) for more info)
  - A *Figure* have `data` property (see [Available Figure types](#available-figure-types) for more info)
  - A *Figure* have `params` (see [Available Figure types](#available-figure-types) for more info)
  - A *Figure* **can** have `slots` property, to position more accurately your figure.
- You can export other variables as options for the whole layout (`export const myVar = 0` in TS, `exports.myVar = 0` in JS)
  - You can export `GRID` in order to use a custom grid (Type: `{ rows: number, cols: number }`)
  - Any other export is ignored
- You can import other layouts (`import myFirstLayout from './first-layout'` in TS, `const myFirstLayout = require('./first-layout')` in JS) to extends them
- Avoid to add a package for only one layout

### Available Figure types

- [All vega-lite marks](https://vega.github.io/vega-lite/docs/mark.html#types)
  - **`data` type:** `any[]` (cf. [vega-lite docs](https://vega.github.io/vega-lite/docs/data.html#inline))
  - **`params` type:** See [`InputVegaParams` in `lib/vega/index.ts`](../lib/vega/index.ts#L72)
- table
  - **`data` type:** `any[]` (cf. [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable#content-options))
  - **`params` type:** `{ title: string|(data) => string, maxLength?: number, maxHeight?: number }` + [other table options](https://github.com/simonbengtsson/jsPDF-AutoTable) (except `body`)
- md
  - **`data` type**: `string`
  - **`params` type:** `{}`
- metric
  - **`data` type**: `{ key: string, value: number|string }[]`
  - **`params` type:** `{}`

## Usage

Just add in your task's layout :

```json
"extends": "path/to/mySuperLayout"
```

## Example

[basic layout](./basic.ts) is a good example in TS. But if you can't open the file, here's a few more simple examples :

### TypeScript

```ts
import type { Figure } from '../models/figures';
import type { LayoutFnc } from '../models/layouts';

export const GRID = { rows: 2, cols: 2 };

const mySuperLayout: LayoutFnc = () => {
  return [
    (): [Figure<'md'>] => {
      return [
        { type: 'md', data: '0,1,2,3 (all) (auto)', params: {} },
      ];
    },
  ];
};

export default mySuperLayout;
```

### JavaScript

```js
exports.GRID = { rows: 2, cols: 2 };

const mySuperLayout = () => {
  return [
    () => [
      { type: 'md', data: '0,1,2,3 (all) (auto)', params: {} },
    ],
  ];
};

exports.default = mySuperLayout;
```