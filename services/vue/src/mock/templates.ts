import type { templates } from '@ezpaarse-project/ezreeport-sdk-js';

const data: templates.FullTemplate[] = [
  {
    name: 'basic',
    renderer: 'vega-pdf',
    pageCount: 6,
    body: {
      layouts: [
        {
          fetchOptions: {
            fetchCount: 'total_count',
            aggs: [
              {
                name: 'consult_by_date',
                date_histogram: {
                  field: 'datetime',
                },
              },
              {
                name: 'platforms',
                cardinality: {
                  field: 'portal',
                },
              },
              {
                name: 'min_date',
                min: {
                  field: 'datetime',
                },
              },
              {
                name: 'max_date',
                max: {
                  field: 'datetime',
                },
              },
            ],
          },
          figures: [
            {
              type: 'metric',
              params: {
                labels: {
                  total_count: {
                    text: 'Consultations',
                  },
                  platforms: {
                    text: 'Plateformes',
                  },
                  min_date: {
                    text: 'Début de période',
                    format: {
                      type: 'date',
                      params: [
                        'dd LLL yyyy',
                      ],
                    },
                  },
                  max_date: {
                    text: 'Fin de période',
                    format: {
                      type: 'date',
                      params: [
                        'dd LLL yyyy',
                      ],
                    },
                  },
                },
              },
              slots: [
                0,
                1,
              ],
            },
            {
              type: 'bar',
              params: {
                dataKey: 'consult_by_date',
                title: 'Histogramme consultations',
                value: {
                  field: 'doc_count',
                  title: 'Nombre de consultations',
                },
                label: {
                  field: 'key',
                  title: '',
                },
                dataLabel: {
                  format: 'numeric',
                  minValue: 20,
                },
              },
              slots: [
                2,
                3,
              ],
            },
          ],
        },
        {
          fetchOptions: {
            aggs: [
              {
                terms: {
                  field: 'rtype',
                },
              },
            ],
          },
          figures: [
            {
              type: 'arc',
              params: {
                dataKey: 'agg0',
                title: 'Camembert consultations par type',
                value: {
                  field: 'doc_count',
                },
                label: {
                  field: 'key',
                  title: 'Type',
                  legend: null,
                },
                dataLabel: {
                  format: 'percent',
                  showLabel: true,
                },
              },
              slots: [
                0,
                2,
              ],
            },
            {
              type: 'table',
              params: {
                dataKey: 'agg0',
                title: 'Top {{length}} des consultations par type',
                maxLength: 20,
                columns: [
                  {
                    header: 'Type',
                    dataKey: 'key',
                  },
                  {
                    header: 'Nombre de consultations',
                    dataKey: 'doc_count',
                  },
                ],
              },
              slots: [
                1,
                3,
              ],
            },
          ],
        },
        {
          fetchOptions: {
            aggs: [
              {
                terms: {
                  field: 'platform_name',
                  size: 20,
                },
              },
            ],
          },
          figures: [
            {
              type: 'table',
              params: {
                dataKey: 'agg0',
                title: 'Top {{length}} des consultations par plateforme',
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
            },
          ],
        },
        {
          fetchOptions: {
            aggs: [
              {
                filters: {
                  filters: {
                    'Avec DOI': {
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
                    'Sans DOI': {
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
            ],
          },
          figures: [
            {
              type: 'arc',
              params: {
                dataKey: 'agg0',
                title: 'Camembert consultations avec ou sans DOI',
                value: {
                  field: 'value.doc_count',
                },
                label: {
                  field: 'key',
                  title: 'Type',
                },
                dataLabel: {
                  format: 'percent',
                  showLabel: true,
                },
              },
            },
          ],
        },
        {
          fetchOptions: {
            aggs: [
              {
                terms: {
                  field: 'publication_title',
                  order: {
                    _count: 'desc',
                  },
                  size: 20,
                },
                aggs: {
                  publisher: {
                    top_hits: {
                      size: 1,
                      _source: {
                        include: [
                          'publisher_name',
                        ],
                      },
                    },
                  },
                },
              },
            ],
          },
          figures: [
            {
              type: 'table',
              params: {
                dataKey: 'agg0',
                title: 'Top {{length}} des consultations par titre',
                columns: [
                  {
                    header: 'Publication',
                    dataKey: 'key',
                  },
                  {
                    header: 'Editeurs',
                    dataKey: 'publisher[0].publisher_name',
                  },
                  {
                    header: 'Nombre de consultations',
                    dataKey: 'doc_count',
                  },
                ],
              },
            },
          ],
        },
        {
          fetchOptions: {
            aggs: [
              {
                terms: {
                  field: 'publication_date',
                  size: 10,
                },
              },
            ],
          },
          figures: [
            {
              type: 'arc',
              params: {
                dataKey: 'agg0',
                title: 'Camembert des {{length}} années de publications les plus consultées',
                value: {
                  field: 'doc_count',
                },
                label: {
                  field: 'key',
                  title: 'Année',
                  legend: null,
                },
                dataLabel: {
                  format: 'percent',
                  showLabel: true,
                },
              },
            },
          ],
        },
      ],
    },
    createdAt: new Date(Date.parse('2022-11-14T09:18:35.194Z')),
    updatedAt: new Date(Date.parse('2023-01-13T09:26:36.345Z')),
  },
];

export default data;
