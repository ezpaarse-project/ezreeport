import type { estypes as ElasticTypes } from '@elastic/elasticsearch';
import { format, formatISO } from 'date-fns';
import { merge } from 'lodash';
import { elasticCheckIndex, elasticCount, elasticSearch } from '../lib/elastic';
import { calcElasticInterval } from '../lib/recurrence';
import type { Figure, LayoutFnc } from '../models/reports';

interface DataOptions {
  indexPrefix: string; // Provided at runtime
  indexSuffix: string; // Provided in task
  filters?: ElasticTypes.QueryDslQueryContainer | ElasticTypes.QueryDslQueryContainer[];
}

type AggregationResult<T extends { key: unknown }> = {
  buckets: T[];
  after_key?: T['key']
};

const basicLayout: LayoutFnc = async (
  { period, recurrence, user },
  { indexPrefix, indexSuffix, filters }: DataOptions,
) => {
  const index = indexPrefix + indexSuffix;
  // Check if index pattern is valid
  const indexExist = await elasticCheckIndex(index);
  if (!indexExist) {
    throw new Error(`Index "${index}" doesn't exists. Please contact administators.`);
  }

  const baseOpts: ElasticTypes.SearchRequest['body'] = {
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
  };
  const calendarInterval = calcElasticInterval(recurrence);

  return [
    // Intro
    (): Figure<'md'> => ({
      type: 'md',
      data: `### **Rapport hebdomadaire des consultations BibCNRS**

Ce rapport est destiné à montrer les consultations de BibCNRS des 10 instituts lors de la semaine écoulée.

[![ezmesure](https://blog.ezpaarse.org/wp-content/uploads/2017/11/logo-ezMESURE.png)](https://ezmesure.couperin.org/)
[![bibcnrs](https://www.inist.fr/wp-content/uploads/2018/07/bibcnrs-logo-visite-e1530711678757.png)](https://bib.cnrs.fr/)`,
      params: {},
    }),

    // Metrics
    async (): Promise<Figure<'metric'>> => {
      const opts: ElasticTypes.SearchRequest = {
        index,
        size: 0,
        body: {
          ...baseOpts,
          aggs: {
            platforms: {
              cardinality: {
                field: 'portal',
              },
            },
            min_date: {
              min: {
                field: 'datetime',
              },
            },
            max_date: {
              max: {
                field: 'datetime',
              },
            },
          },
        },
      };

      type Aggs = {
        platforms: { value: number }
        min_date: { value: number }
        max_date: { value: number }
      };

      const { body: { aggregations } } = await elasticSearch(opts, user);
      if (
        !aggregations?.platforms
        || !aggregations?.min_date
        || !aggregations?.max_date
      ) {
        throw new Error('Aggregation(s) not found');
      }
      const {
        platforms,
        min_date: minDate,
        max_date: maxDate,
      } = aggregations as Aggs;

      const { body: { count } } = await elasticCount({ index, body: baseOpts }, user);

      return {
        type: 'metric',
        data: [
          { key: 'Consultations', value: count },
          { key: 'Plateformes', value: platforms.value },
          { key: 'Début de période', value: format(minDate.value, 'dd LLL yyyy') },
          { key: 'Fin de période', value: format(maxDate.value, 'dd LLL yyyy') },
        ],
        params: {},
      };
    },

    // Histogramme consultations
    async (): Promise<Figure<'bar'>> => {
      const opts: ElasticTypes.SearchRequest = {
        index,
        size: 0,
        body: {
          ...baseOpts,
          aggs: {
            consult_by_date: {
              date_histogram: {
                field: 'datetime',
                calendar_interval: calendarInterval,
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
      // Scroll through pagination
      do {
        // eslint-disable-next-line no-await-in-loop
        const { body: { aggregations } } = await elasticSearch(
          merge(
            opts,
            { body: { aggs: { consult_by_date: { after } } } },
          ),
          user,
        );
        if (!aggregations?.consult_by_date) throw new Error('Aggregation(s) not found');

        const { buckets, after_key: afterKey } = aggregations.consult_by_date as AggregationResult<{
          doc_count: number;
          key: { consult_by_date: number; consult_by_portal: string };
        }>;

        data.push(...buckets);
        after = afterKey;
      } while (after != null);

      // Return params for Vega-lite helper
      return {
        type: 'bar',
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
          // debugExport: process.env.NODE_ENV !== 'production',
        },
      };
    },

    // Consultations par type
    async (): Promise<[Figure<'arc'>, Figure<'table'>]> => {
      const opts: ElasticTypes.SearchRequest = {
        index,
        size: 0,
        body: {
          ...baseOpts,
          aggs: {
            consult_by_type: {
              terms: {
                field: 'rtype',
              },
            },
          },
        },
      };

      const { body: { aggregations } } = await elasticSearch(opts, user);
      if (!aggregations?.consult_by_type) throw new Error('Aggregation(s) not found');
      const {
        buckets: data,
      } = aggregations.consult_by_type as AggregationResult<{ doc_count: number, key: string }>;

      // Return params for Vega-lite helper
      return [
        {
          type: 'arc',
          data,
          // TODO[feat]: custom color for each label, "ARTICLE" graph1 == "ARTICLE" graph 2
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
            title: ({ length }) => `Top ${length} des consultations par type`,
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
        },
      ];
    },

    // Consultation par plateforme
    async (): Promise<Figure<'table'>> => {
      const opts: ElasticTypes.SearchRequest = {
        index,
        size: 0,
        body: {
          ...baseOpts,
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

      const { body: { aggregations } } = await elasticSearch(opts, user);
      if (!aggregations?.consult_by_platform) throw new Error('Aggregation(s) not found');

      const {
        buckets: data,
      } = aggregations.consult_by_platform as AggregationResult<{ doc_count: number, key: string }>;

      return {
        type: 'table',
        data,
        params: {
          title: ({ length }) => `Top ${length} des consultations par plateforme`,
          columns: [
            {
              header: 'Plateforme',
              dataKey: 'key',
            },
            {
              header: 'Nombre de consultations',
              dataKey: 'doc_count',
            },
          ],
        },
      };
    },

    // Consultations DOI
    async (): Promise<Figure<'arc'>> => {
      const opts: ElasticTypes.SearchRequest = {
        index,
        size: 0,
        body: {
          ...baseOpts,
          aggs: {
            consult_by_doi: {
              filters: {
                // TODO[refactor]: Can be better (?)
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

      const { body: { aggregations } } = await elasticSearch(opts, user);
      if (!aggregations?.consult_by_doi) throw new Error('Aggregation(s) not found');

      const {
        buckets: data,
      } = aggregations.consult_by_doi as {
        buckets: {
          with: { doc_count: number, key: string },
          without: { doc_count: number, key: string }
        }
      };

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
    async (): Promise<Figure<'table'>> => {
      const opts: ElasticTypes.SearchRequest = {
        index,
        size: 0,
        body: {
          ...baseOpts,
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

      const { body: { aggregations } } = await elasticSearch(opts, user);
      if (!aggregations?.consult_by_title) throw new Error('Aggregation(s) not found');

      const {
        buckets,
      } = aggregations.consult_by_title as AggregationResult<
      {
        doc_count: number,
        key: string,
        publisher: ElasticTypes.SearchResponse<Pick<ElasticConsultation, 'publisher_name'>>
      }>;

      const data = buckets.map(({ doc_count, key, publisher: { hits: { hits } } }) => ({
        title: key,
        count: doc_count,
        // eslint-disable-next-line no-underscore-dangle
        publisher: (hits.length > 0 && hits[0]._source?.publisher_name) || '',
      }));

      return {
        type: 'table',
        data,
        params: {
          title: ({ length }) => `Top ${length} des consultations par titre`,
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
            },
          ],
        },
      };
    },

    // Consultations des 10 années
    async (): Promise<Figure<'arc'>> => {
      const opts: ElasticTypes.SearchRequest = {
        index,
        size: 0,
        body: {
          ...baseOpts,
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

      const { body: { aggregations } } = await elasticSearch(opts, user);
      if (!aggregations?.consult_by_type) throw new Error('Aggregation(s) not found');

      const {
        buckets: data,
      } = aggregations.consult_by_type as AggregationResult<{ doc_count: number, key: string }>;

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
};

export default basicLayout;
