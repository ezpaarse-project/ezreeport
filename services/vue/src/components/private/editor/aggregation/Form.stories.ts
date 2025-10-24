import type { Meta, StoryObj } from '@storybook/vue3-vite';

import type { FigureAggregation } from '~sdk/helpers/aggregations';

import EditorAggregationForm from './Form.vue';

const meta: Meta<typeof EditorAggregationForm> = {
  title: 'Template Editor/Aggregations/Form',
  component: EditorAggregationForm,
};

export default meta;

type Story = StoryObj<typeof EditorAggregationForm>;

const mockMetricData: FigureAggregation = {
  type: 'sum',
  field: 'Count',
};

const mockBucketData: FigureAggregation = {
  type: 'date_histogram',
  field: 'datetime',
};

const mockRawData: FigureAggregation = {
  raw: {
    filters: {
      filters: {
        Doctorat: {
          bool: {
            must: [],
            filter: [
              {
                bool: {
                  should: [
                    {
                      bool: {
                        should: [
                          {
                            match_phrase: {
                              'u-niveau': 'Bac-6-B6-',
                            },
                          },
                        ],
                        minimum_should_match: 1,
                      },
                    },
                  ],
                  minimum_should_match: 1,
                },
              },
            ],
            should: [],
            must_not: [],
          },
        },
        Personnels: {
          bool: {
            must: [],
            filter: [
              {
                bool: {
                  should: [
                    {
                      bool: {
                        filter: [
                          {
                            bool: {
                              should: [
                                {
                                  match_phrase: {
                                    'u-groupe': 'Personnels',
                                  },
                                },
                              ],
                              minimum_should_match: 1,
                            },
                          },
                          {
                            bool: {
                              should: [
                                {
                                  match_phrase: {
                                    'u-niveau': 'empty',
                                  },
                                },
                              ],
                              minimum_should_match: 1,
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
                              should: [
                                {
                                  match_phrase: {
                                    'u-groupe': 'Professeurs',
                                  },
                                },
                              ],
                              minimum_should_match: 1,
                            },
                          },
                          {
                            bool: {
                              should: [
                                {
                                  match_phrase: {
                                    'u-niveau': 'empty',
                                  },
                                },
                              ],
                              minimum_should_match: 1,
                            },
                          },
                        ],
                      },
                    },
                  ],
                  minimum_should_match: 1,
                },
              },
            ],
            should: [],
            must_not: [],
          },
        },
        'Non renseigné': {
          bool: {
            must: [],
            filter: [
              {
                bool: {
                  filter: [
                    {
                      bool: {
                        should: [
                          {
                            match_phrase: {
                              'u-niveau': 'unknownuser',
                            },
                          },
                        ],
                        minimum_should_match: 1,
                      },
                    },
                    {
                      bool: {
                        should: [
                          {
                            match_phrase: {
                              'u-groupe': 'unknownuser',
                            },
                          },
                        ],
                        minimum_should_match: 1,
                      },
                    },
                  ],
                },
              },
            ],
            should: [],
            must_not: [],
          },
        },
        'Autres lecteurs': {
          bool: {
            must: [],
            filter: [
              {
                bool: {
                  should: [
                    {
                      bool: {
                        filter: [
                          {
                            bool: {
                              should: [
                                {
                                  match_phrase: {
                                    'u-niveau': 'empty',
                                  },
                                },
                              ],
                              minimum_should_match: 1,
                            },
                          },
                          {
                            bool: {
                              should: [
                                {
                                  match_phrase: {
                                    'u-groupe': 'Formation-continue',
                                  },
                                },
                              ],
                              minimum_should_match: 1,
                            },
                          },
                        ],
                      },
                    },
                  ],
                  minimum_should_match: 1,
                },
              },
            ],
            should: [],
            must_not: [],
          },
        },
        'Autres indications de niveau': {
          bool: {
            must: [],
            filter: [
              {
                bool: {
                  should: [
                    {
                      bool: {
                        should: [
                          {
                            match_phrase: {
                              'u-niveau': 'Avant-Bac-B0-',
                            },
                          },
                        ],
                        minimum_should_match: 1,
                      },
                    },
                    {
                      bool: {
                        should: [
                          {
                            match_phrase: {
                              'u-niveau': 'Bac-1-B1-Bac-2-B2-',
                            },
                          },
                        ],
                        minimum_should_match: 1,
                      },
                    },
                  ],
                  minimum_should_match: 1,
                },
              },
            ],
            should: [],
            must_not: [],
          },
        },
      },
    },
  },
};

const mockFiltersData: FigureAggregation = {
  type: 'filters',
  values: [
    {
      label: 'Doctorat',
      filters: [
        {
          name: 'u-niveau is B6',
          field: 'u-niveau',
          value: 'Bac-6-B6-',
        },
      ],
    },
    {
      label: 'Personnels',
      filters: [
        {
          name: 'u-group is Personnels',
          field: 'u-group',
          value: 'Personnels',
        },
        {
          name: 'u-niveau is empty',
          field: 'u-niveau',
          value: 'empty',
        },
      ],
    },
  ],
};

export const NewMetric: Story = {
  render: (args) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
  args: {
    type: 'metric',
  },
};

export const ExistingMetric: Story = {
  render: (args) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
  args: {
    modelValue: mockMetricData,
    type: 'metric',
  },
};

export const NewBucket: Story = {
  render: (args) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
  args: {
    type: 'bucket',
  },
};

export const ExistingBucket: Story = {
  render: (args) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
  args: {
    modelValue: mockBucketData,
    type: 'bucket',
  },
};

export const ExistingRaw: Story = {
  render: (args) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
  args: {
    modelValue: mockRawData,
  },
};

export const ExistingFilters: Story = {
  render: (args) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
  args: {
    modelValue: mockFiltersData,
  },
};

export const Readonly: Story = {
  render: (args) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
  args: {
    modelValue: mockBucketData,
    readonly: true,
    type: 'bucket',
  },
};

export const Disabled: Story = {
  render: (args) => ({
    components: { EditorAggregationForm },
    setup() {
      return { args };
    },
    template: '<EditorAggregationForm v-bind="args" />',
  }),
  args: {
    modelValue: mockBucketData,
    disabled: true,
    type: 'bucket',
  },
};
