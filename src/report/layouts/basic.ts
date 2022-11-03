import type { RequestParams } from '@elastic/elasticsearch';
import { merge } from 'lodash';
import { getElasticClient } from '../lib/elastic';
import type { PDFReportOptions } from '../lib/pdf';
import type { VegaFigure } from '../lib/vega';

interface DataOptions {
  index: string;
  filters?: Record<string, any>;
}

export default [
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
          consult_by_date: {
            date_histogram: {
              field: 'datetime',
              // TODO[feat]: Dependent on RECCURRENCE
              calendar_interval: 'day',
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
            consult_by_date: { buckets, after_key: afterKey },
          },
        },
        // eslint-disable-next-line no-await-in-loop
      } = await elastic.search(
        // Merge base options & pagination
        merge(opts, {
          body: { aggs: { consult_by_date: { after } } },
        }),
      );

      data.push(...buckets);
      after = afterKey;
      // Fetch while there's data
    } while (after != null);

    // Return params for Vega-lite helper
    return {
      type: 'bar',
      // data: data.filter((v) => {
      //   const date = new Date(v.key);
      //   return isBefore(period.start, date) && isAfter(period.end, date);
      // }),
      data,
      params: {
        title: {
          text: 'Histogramme consultations',
        },
        value: {
          field: 'doc_count',
          title: 'Nombre de consultations',
        },
        label: {
          field: 'key',
          timeUnit: 'monthdate',
          title: '',
        },
        dataLabel: {
          format: 'numeric',
        },
        debugExport: process.env.NODE_ENV !== 'production',
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
          consult_by_type: {
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
          consult_by_type: { buckets: data },
        },
      },
    } = await elastic.search(opts);

    // Return params for Vega-lite helper
    return {
      type: 'arc',
      data,
      params: {
        title: {
          text: 'Camembert consultations par type',
        },
        value: {
          field: 'doc_count',
        },
        label: {
          field: 'key',
          title: 'Type',
        },
        dataLabel: {
          format: 'percent',
          showLabel: true,
        },
        // debugExport: process.env.NODE_ENV !== 'production',
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
          consult_by_type: {
            terms: {
              field: 'rtype',
              size: 10,
            },
          },
        },
      },
    };

    const elastic = await getElasticClient();

    const {
      body: {
        aggregations: {
          consult_by_type: { buckets: data },
        },
      },
    } = await elastic.search(opts);

    return {
      type: 'table',
      data,
      params: {
        title: 'Top 10 des consultations par type',
        columns: [
          {
            header: 'Type',
            dataKey: 'key',
          },
          {
            header: 'Nombre de consultations',
            dataKey: 'doc_count',
            // showSum: true // TODO[refactor]: Include param for showing sum
          },
        ],
        // foot: [
        //   [
        //     '',
        //     // Calc total
        //     (data as any[]).reduce(
        //       (prev, { doc_count: docCount }) => prev + docCount,
        //       0,
        //     ),
        //   ],
        // ],
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
          consult_by_platform: {
            terms: {
              field: 'platform_name',
              size: 15,
            },
          },
        },
      },
    };

    const elastic = await getElasticClient();

    const {
      body: {
        aggregations: {
          consult_by_platform: { buckets: data },
        },
      },
    } = await elastic.search(opts);

    return {
      type: 'table',
      data,
      params: {
        title: 'Top 15 des consultations par plateforme',
        columns: [
          {
            header: 'Plateforme',
            dataKey: 'key',
          },
          {
            header: 'Nombre de consultations',
            dataKey: 'doc_count',
            // showSum: true // TODO[refactor]: Include param for showing sum
          },
        ],
        // foot: [
        //   [
        //     '',
        //     // Calc total
        //     (data as any[]).reduce(
        //       (prev, { doc_count: docCount }) => prev + docCount,
        //       0,
        //     ),
        //   ],
        // ],
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
          consult_by_doi: {
            filters: {
              // ? https://www.elastic.co/guide/en/elasticsearch/reference/7.17/search-aggregations-bucket-missing-aggregation.html
              filters: {
                with: {
                  bool: {
                    must: [
                      {
                        query_string: {
                          query: '_exists_:doi',
                          analyze_wildcard: true,
                        },
                      },
                    ],
                  },
                },
                without: {
                  bool: {
                    must: [
                      {
                        query_string: {
                          query: '!_exists_:doi',
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    };

    const elastic = await getElasticClient();

    const {
      body: {
        aggregations: {
          consult_by_doi: { buckets: data },
        },
      },
    } = await elastic.search(opts);

    // Return params for Vega-lite helper
    return {
      type: 'arc',
      data: [
        { key: 'Avec DOI', doc_count: data.with.doc_count },
        { key: 'Sans DOI', doc_count: data.without.doc_count },
      ],
      params: {
        title: {
          text: 'Camembert consultations avec ou sans DOI',
        },
        value: {
          field: 'doc_count',
        },
        label: {
          field: 'key',
          title: 'Type',
        },
        dataLabel: {
          format: 'percent',
          showLabel: true,
        },
        // debugExport: process.env.NODE_ENV !== 'production',
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
          consult_by_title: {
            terms: {
              field: 'publication_title',
              order: { _count: 'desc' },
              size: 10,
            },
            aggs: {
              publisher: {
                top_hits: {
                  size: 1,
                  _source: {
                    include: ['publisher_name'],
                  },
                },
              },
            },
          },
        },
      },
    };

    const elastic = await getElasticClient();

    const {
      body: {
        aggregations: {
          consult_by_title: { buckets: data },
        },
      },
    } = await elastic.search(opts);

    // TODO: FINISH
    return {
      type: 'table',
      data: (data as any[]).map(({
        doc_count, key, publisher: { hits: { hits } },
      }) => ({
        title: key,
        // eslint-disable-next-line no-underscore-dangle
        publisher: (hits as any[]).length > 0 ? hits[0]._source.publisher_name : '',
        count: doc_count,
      })),
      params: {
        title: 'Top 10 des consultations par titre',
        columns: [
          {
            header: 'Publication',
            dataKey: 'title',
          },
          {
            header: 'Editeurs',
            dataKey: 'publisher',
          },
          {
            header: 'Nombre de consultations',
            dataKey: 'count',
            // showSum: true // TODO[refactor]: Include param for showing sum
          },
        ],
        // foot: [
        //   [
        //     '',
        //     '',
        //     // Calc total
        //     (data as any[]).reduce(
        //       (prev, { doc_count: docCount }) => prev + docCount,
        //       0,
        //     ),
        //   ],
        // ],
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
          consult_by_type: {
            terms: {
              field: 'publication_date',
              size: 10,
            },
          },
        },
      },
    };

    const elastic = await getElasticClient();

    const {
      body: {
        aggregations: {
          consult_by_type: { buckets: data },
        },
      },
    } = await elastic.search(opts);

    // Return params for Vega-lite helper
    return {
      type: 'arc',
      data,
      params: {
        title: {
          text: 'Camembert des 10 années de publications les plus consultées',
        },
        value: {
          field: 'doc_count',
        },
        label: {
          field: 'key',
          title: 'Année',
        },
        dataLabel: {
          format: 'percent',
          showLabel: true,
        },
        // debugExport: process.env.NODE_ENV !== 'production',
      },
    };
  },

];
