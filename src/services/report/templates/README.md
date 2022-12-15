# Reporting Templates

Contains all possible template usable by various tasks

## How to write a Template

- Root object describe a report.
  - *[optional]* `fetchOptions` - Options passed to fetcher (see [available fetchers](#available-fetchers) for more info)
  - *[optional]* `renderer` - **Default: `"vega-pdf"`** - Name of the renderer. See [available renderers](#available-renderers) for more info.
  - *[optional]* `renderOptions` - Options passed to renderer (see [available renderers](#available-renderers) for more info)
  - `layouts` (`Layout[]`) - Pages of the report
    - *[optional]* `data` - Data passed to figures
    - *[optional]* `fetcher` - **Default: `"elastic"`** - Name of the fetcher. Ignored if `data` is provided. Merged with root's `fetchOptions`. See [available fetchers](#available-fetchers) for more info.
    - **[conditional]** `fetchOptions` - Options passed to fetcher. Must be present if `data` is not provided, if `fetcher` is not `none`, and if `data` is not provided **for each** figure. See [available fetchers](#available-fetchers) for more info
    - `figures` (`Figure[]`) - Describe figure
      - `type` - Type of figure (see [available Figure](#available-figure) for more info)
      - *[optional]* `data` - Specific data of figure. (see [available Figure](#available-figure) for more info). Override layout's data.
      - `params` - Params of figure (see [available Figure](#available-figure) for more info).
      - `slots` - Slots used by figure. **Only when `"renderer": "vega-pdf"`**.

### Available fetchers

- `elastic`: Fetch data from `ezMesure`'s ElasticSearch
  - `options` : See [`FetchOptions` in `lib/generators/fetchers/elastic.ts`](../lib/generators/fetchers/elastic.ts#L14)
    - `recurrence`, `period`, `indexPrefix` and `user` are already passed (and overrided when generation is started)

### Available renderers

- `vega-pdf`: Render data into PDF with Vega
  - `options` : See [`RenderOptions` in `lib/generators/renderers/vega-pdf.ts`](../lib/generators/renderers/vega-pdf.ts#26)
    - `pdf`, `recurrence`, `debug` and `layouts` are already passed (and overrided when generation is started)

### Available Figure

- [All vega-lite marks](https://vega.github.io/vega-lite/docs/mark.html#types)
  - **`data` type:** `any[] | { [string]: any[] }` (cf. [vega-lite docs](https://vega.github.io/vega-lite/docs/data.html#inline)). If it's an object, `dataKey` must be present in `params`
  - **`params` type:** See [`InputVegaParams` in `lib/vega/index.ts`](../lib/vega/index.ts#L78)
- `table`
  - **`data` type:** `any[] | { [string]: any[] }` (cf. [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable#content-options)). If it's an object, `dataKey` must be present in `params`
  - **`params` type:** `{ title: string, maxLength?: number, maxHeight?: number, dataKey: string }` + [other table options](https://github.com/simonbengtsson/jsPDF-AutoTable) (except `body`)
- `md`
  - **`data` type**: `string`
  - **`params` type:** `{}`
- `metric`
  - **`data` type**: `{ key: string, value: number|string, dataKey: string }[]`
  - **`params` type:** `{}`

### Additional notes

- All `title` properties are passed to [handlebars](https://handlebarsjs.com/), so you can template titles (eg: `Best {{ length }} items`). The following options are possible :
  - `length` - data count

## Usage

Just add in your task's template :

```json
"extends": "path/to/mySuperTemplate"
```

## Example

[basic template](./basic.json) is a good example. But if you can't open the file, here's a few more simple examples :

```json
{
  "layouts": [
    {
      "fetchOptions": {
        "fetchCount": "total_count",
        "aggs": [
          {
            "name": "consult_by_date",
            "date_histogram": {
              "field": "datetime"
            }
          },
          {
            "name": "platforms",
            "cardinality": {
              "field": "portal"
            }
          },
          {
            "name": "min_date",
            "min": {
              "field": "datetime"
            }
          },
          {
            "name": "max_date",
            "max": {
              "field": "datetime"
            }
          }
        ]
      },
      "figures": [
        {
          "type": "metric",
          "params": {
            "labels": {
              "total_count": {
                "text": "Consultations"
              },
              "platforms": {
                "text": "Plateformes"
              },
              "min_date": {
                "text": "Début de période",
                "format": {
                  "type": "date",
                  "params": [
                    "dd LLL yyyy"
                  ]
                }
              },
              "max_date": {
                "text": "Fin de période",
                "format": {
                  "type": "date",
                  "params": [
                    "dd LLL yyyy"
                  ]
                }
              }
            }
          },
          "slots": [0, 1]
        },
      ]
    }
  ]
}
```