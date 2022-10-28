/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { RequestParams } from '@elastic/elasticsearch';
import { isAfter, isBefore } from 'date-fns';
import { merge } from 'lodash';
import { getElasticClient } from '../lib/elastic';
import type { PDFReportOptions } from '../lib/pdf';
import type { LayoutVegaFigure, VegaFigure } from '../lib/vega';

interface DataOptions {
  index: string;
  filters?: Record<string, any>;
}

const layout: LayoutVegaFigure = [
  // Creating stacked bar figure
  async (
    { period }: PDFReportOptions,
    { index, filters }: DataOptions,
  ): Promise<VegaFigure<'bar'>> => {
    const opts: RequestParams.Search = {
      index,
      size: 0,
      body: {
        query: {
          bool: {
            ...filters,
            filter: {
              range: {
                datetime: {
                  gte: period.start,
                  lte: period.end,
                },
              },
            },
          },
        },
        aggs: {
          consult_by_portal_date: {
            composite: {
              size: 12,
              sources: [
                {
                  consult_by_date: {
                    date_histogram: {
                      field: 'datetime',
                      calendar_interval: 'month',
                    },
                  },
                },
                {
                  consult_by_portal: {
                    terms: {
                      field: 'portal',
                    },
                  },
                },
              ],
            },
          },
        },
      },
    };

    interface Aggregate {
      doc_count: number;
      key: { consult_by_date: number; consult_by_portal: string };
    }

    const elastic = await getElasticClient();

    const data: Aggregate[] = [];
    let after: Aggregate['key'] | undefined;
    do {
      const {
        body: {
          aggregations: {
            consult_by_portal_date: { buckets, after_key: afterKey },
          },
        },
        // eslint-disable-next-line no-await-in-loop
      } = await elastic.search(
        // Merge base options & pagination
        merge(opts, {
          body: { aggs: { consult_by_portal_date: { composite: { after } } } },
        }),
      );

      data.push(...buckets);
      after = afterKey;
      // Fetch while there's data
    } while (after != null);

    // Return params for Vega-lite helper
    return {
      type: 'bar',
      data: data.filter((v) => {
        const date = new Date(v.key.consult_by_date);
        return isBefore(period.start, date) && isAfter(period.end, date);
      }),
      params: {
        title: 'Histogramme consultations par instituts',
        debugExport: true,
        dataLabel: true,
        spec: {
          encoding: {
            x: {
              field: 'key.consult_by_date',
              type: 'nominal',
              timeUnit: 'yearmonth',
              title: '',
            },
            y: {
              field: 'doc_count',
              type: 'quantitative',
              aggregate: 'sum',
              stack: 'zero',
              title: 'Nombre de consultations',
            },
            color: {
              field: 'key.consult_by_portal',
              type: 'nominal',
              title: 'Institut',
            },
          },
        },
      },
    };
  },
  // Creating table figure
  async (
    { period }: PDFReportOptions,
    { index, filters }: DataOptions,
  ): Promise<VegaFigure<'table'>> => {
    const opts: RequestParams.Search = {
      index,
      size: 0,
      body: {
        query: {
          bool: {
            ...filters,
            filter: {
              range: {
                datetime: {
                  gte: period.start,
                  lte: period.end,
                },
              },
            },
          },
        },
        aggs: {
          consult_by_portal: {
            terms: {
              field: 'portal',
            },
          },
        },
      },
    };

    const elastic = await getElasticClient();

    const {
      body: {
        aggregations: {
          consult_by_portal: { buckets: data },
        },
      },
    } = await elastic.search(opts);

    return {
      type: 'table',
      data,
      params: {
        title: 'Table consultations par instituts',
        columns: [
          {
            header: 'Portail',
            dataKey: 'key',
          },
          { header: 'Nombre de consultations', dataKey: 'doc_count' },
        ],
        foot: [
          [
            '',
            (data as any[]).reduce(
              (prev, { doc_count: docCount }) => prev + docCount,
              0,
            ),
          ],
        ],
      },
    };
  },
  // Creating pie figure
  async (
    { period }: PDFReportOptions,
    { index, filters }: DataOptions,
  ): Promise<VegaFigure<'arc'>> => {
    const opts: RequestParams.Search = {
      index,
      size: 0,
      body: {
        query: {
          bool: {
            ...filters,
            filter: {
              range: {
                datetime: {
                  gte: period.start,
                  lte: period.end,
                },
              },
            },
          },
        },
        aggs: {
          consult_by_portal: {
            terms: {
              field: 'rtype',
            },
          },
        },
      },
    };

    const elastic = await getElasticClient();

    const {
      body: {
        aggregations: {
          consult_by_portal: { buckets: data },
        },
      },
    } = await elastic.search(opts);

    // Return params for Vega-lite helper
    return {
      type: 'arc',
      data,
      params: {
        title: 'Camembert consultations par type',
        debugExport: true,
        dataLabel: {
          spec: {
            mark: {
              type: 'text',
              radius: 180, // TODO
              // TODO : don't show if too little
              // TODO : format
            },
            encoding: {
              text: {
                field: 'doc_count',
              },
            },
          },
        },
        spec: {
          encoding: {
            theta: {
              field: 'doc_count',
              type: 'quantitative',
              stack: true,
            },
            order: {
              field: 'doc_count',
              type: 'quantitative',
              sort: 'descending',
            },
            color: {
              field: 'key',
              type: 'nominal',
              title: 'Type',
            },
          },
        },
      },
    };
  },
];

export default layout;
