import { estypes } from '@elastic/elasticsearch';
import { formatISO } from 'date-fns';
import { merge } from 'lodash';
import { elasticSearch, getElasticClient } from '../lib/elastic';
import type { PDFReportOptions } from '../lib/pdf';
import type { Figure } from '../models/reports';

interface DataOptions {
  index: string;
  filters?: any[];
}

export default [
  // Creating stacked bar figure

  // Histogramme consultations
  async (
    { period }: PDFReportOptions,
    { index, filters }: DataOptions,
  ): Promise<Figure<'bar'>> => {
    const opts: estypes.SearchRequest = {
      index,
      size: 0,
      body: {
        query: {
          bool: {
            ...filters,
            filter: {
              range: {
                datetime: {
                  gte: formatISO(period.start),
                  lte: formatISO(period.end),
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

    interface Bucket {
      doc_count: number;
      key: { consult_by_date: number; consult_by_portal: string };
    }

    const data: Bucket[] = [];
    let after: Bucket['key'] | undefined;
    do {
      // eslint-disable-next-line no-await-in-loop
      const { body: { aggregations } } = await elasticSearch<ElasticConsultation>(
        // Merge base options & pagination
        merge(opts, {
          body: { aggs: { consult_by_date: { after } } },
        }),
      );
      if (!aggregations?.consult_by_date) throw new Error('Aggregation(s) not found');
      const {
        buckets,
        after_key: afterKey,
      } = aggregations.consult_by_date as any;

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

  // Consultations par type
  async (
    { period }: PDFReportOptions,
    { index, filters }: DataOptions,
  ): Promise<[Figure<'arc'>, Figure<'table'>]> => {
    const opts: estypes.SearchRequest = {
      index,
      size: 0,
      body: {
        query: {
          bool: {
            ...filters,
            filter: {
              range: {
                datetime: {
                  gte: formatISO(period.start),
                  lte: formatISO(period.end),
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

    type Bucket = {
      doc_count: number,
      key: string
    };

    const { body: { aggregations } } = await elasticSearch<ElasticConsultation>(opts);
    if (!aggregations?.consult_by_type) throw new Error('Aggregation(s) not found');
    const {
      buckets: data,
    } = aggregations.consult_by_type as estypes.AggregationsTermsAggregateBase<Bucket>;

    // Return params for Vega-lite helper
    return [
      {
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
      },
      {
        type: 'table',
        data,
        params: {
          title: `Top ${Math.min((data as any[]).length, 20)} des consultations par type`,
          maxLength: 20,
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
        },
      },
    ];
  },

  // Consultation par plateforme
  async (
    { period }: PDFReportOptions,
    { index, filters }: DataOptions,
  ): Promise<Figure<'table'>> => {
    const opts: estypes.SearchRequest = {
      index,
      size: 0,
      body: {
        query: {
          bool: {
            ...filters,
            filter: {
              range: {
                datetime: {
                  gte: formatISO(period.start),
                  lte: formatISO(period.end),
                },
              },
            },
          },
        },
        aggs: {
          consult_by_platform: {
            terms: {
              field: 'platform_name',
              size: 20,
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
    } = await elastic.search(opts as any);

    return {
      type: 'table',
      data,
      params: {
        title: `Top ${data.length} des consultations par plateforme`,
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

  // Consultations DOI
  async (
    { period }: PDFReportOptions,
    { index, filters }: DataOptions,
  ): Promise<Figure<'arc'>> => {
    const opts: estypes.SearchRequest = {
      index,
      size: 0,
      body: {
        query: {
          bool: {
            ...filters,
            filter: {
              range: {
                datetime: {
                  gte: formatISO(period.start),
                  lte: formatISO(period.end),
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
    } = await elastic.search(opts as any);

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

  // Consultations par titre
  async (
    { period }: PDFReportOptions,
    { index, filters }: DataOptions,
  ): Promise<Figure<'table'>> => {
    const opts: estypes.SearchRequest = {
      index,
      size: 0,
      body: {
        query: {
          bool: {
            ...filters,
            filter: {
              range: {
                datetime: {
                  gte: formatISO(period.start),
                  lte: formatISO(period.end),
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
    } = await elastic.search(opts as any);

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
        title: `Top ${data.length} des consultations par titre`,
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

  // Consultations des 10 années
  async (
    { period }: PDFReportOptions,
    { index, filters }: DataOptions,
  ): Promise<Figure<'arc'>> => {
    const opts: estypes.SearchRequest = {
      index,
      size: 0,
      body: {
        query: {
          bool: {
            ...filters,
            filter: {
              range: {
                datetime: {
                  gte: formatISO(period.start),
                  lte: formatISO(period.end),
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
    } = await elastic.search(opts as any);

    // Return params for Vega-lite helper
    return {
      type: 'arc',
      data,
      params: {
        title: {
          text: `Camembert des ${data.length} années de publications les plus consultées`,
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
