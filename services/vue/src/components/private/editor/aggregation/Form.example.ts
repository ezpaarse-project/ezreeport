import type { FigureAggregation } from '~sdk/helpers/aggregations';

export const mockMetricData: FigureAggregation = {
  field: 'Count',
  type: 'sum',
};

export const mockBucketData: FigureAggregation = {
  field: 'datetime',
  type: 'date_histogram',
};

export const mockRawData: FigureAggregation = {
  raw: {
    filters: {
      filters: {
        'Autres indications de niveau': {
          bool: {
            filter: [
              {
                bool: {
                  minimum_should_match: 1,
                  should: [
                    {
                      bool: {
                        minimum_should_match: 1,
                        should: [
                          {
                            match_phrase: {
                              'u-niveau': 'Avant-Bac-B0-',
                            },
                          },
                        ],
                      },
                    },
                    {
                      bool: {
                        minimum_should_match: 1,
                        should: [
                          {
                            match_phrase: {
                              'u-niveau': 'Bac-1-B1-Bac-2-B2-',
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
            must: [],
            must_not: [],
            should: [],
          },
        },
        'Autres lecteurs': {
          bool: {
            filter: [
              {
                bool: {
                  minimum_should_match: 1,
                  should: [
                    {
                      bool: {
                        filter: [
                          {
                            bool: {
                              minimum_should_match: 1,
                              should: [
                                {
                                  match_phrase: {
                                    'u-niveau': 'empty',
                                  },
                                },
                              ],
                            },
                          },
                          {
                            bool: {
                              minimum_should_match: 1,
                              should: [
                                {
                                  match_phrase: {
                                    'u-groupe': 'Formation-continue',
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
            must: [],
            must_not: [],
            should: [],
          },
        },
        Doctorat: {
          bool: {
            filter: [
              {
                bool: {
                  minimum_should_match: 1,
                  should: [
                    {
                      bool: {
                        minimum_should_match: 1,
                        should: [
                          {
                            match_phrase: {
                              'u-niveau': 'Bac-6-B6-',
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
            must: [],
            must_not: [],
            should: [],
          },
        },
        'Non renseigné': {
          bool: {
            filter: [
              {
                bool: {
                  filter: [
                    {
                      bool: {
                        minimum_should_match: 1,
                        should: [
                          {
                            match_phrase: {
                              'u-niveau': 'unknownuser',
                            },
                          },
                        ],
                      },
                    },
                    {
                      bool: {
                        minimum_should_match: 1,
                        should: [
                          {
                            match_phrase: {
                              'u-groupe': 'unknownuser',
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
            must: [],
            must_not: [],
            should: [],
          },
        },
        Personnels: {
          bool: {
            filter: [
              {
                bool: {
                  minimum_should_match: 1,
                  should: [
                    {
                      bool: {
                        filter: [
                          {
                            bool: {
                              minimum_should_match: 1,
                              should: [
                                {
                                  match_phrase: {
                                    'u-groupe': 'Personnels',
                                  },
                                },
                              ],
                            },
                          },
                          {
                            bool: {
                              minimum_should_match: 1,
                              should: [
                                {
                                  match_phrase: {
                                    'u-niveau': 'empty',
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                    {
                      bool: {
                        filter: [
                          {
                            bool: {
                              minimum_should_match: 1,
                              should: [
                                {
                                  match_phrase: {
                                    'u-groupe': 'Professeurs',
                                  },
                                },
                              ],
                            },
                          },
                          {
                            bool: {
                              minimum_should_match: 1,
                              should: [
                                {
                                  match_phrase: {
                                    'u-niveau': 'empty',
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
            must: [],
            must_not: [],
            should: [],
          },
        },
      },
    },
  },
};

export const mockFiltersData: FigureAggregation = {
  type: 'filters',
  values: [
    {
      filters: [
        {
          field: 'u-niveau',
          name: 'u-niveau is B6',
          value: 'Bac-6-B6-',
        },
      ],
      label: 'Doctorat',
    },
    {
      filters: [
        {
          field: 'u-group',
          name: 'u-group is Personnels',
          value: 'Personnels',
        },
        {
          field: 'u-niveau',
          name: 'u-niveau is empty',
          value: 'empty',
        },
      ],
      label: 'Personnels',
    },
  ],
};
