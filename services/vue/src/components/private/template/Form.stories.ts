import type { Meta, StoryObj } from '@storybook/vue3-vite';

import {
  createTemplateHelper,
  createTemplateHelperFrom,
} from '~sdk/helpers/templates';

import TemplateForm from './Form.vue';

const meta: Meta<typeof TemplateForm> = {
  title: 'Template/Form',
  component: TemplateForm,
};

export default meta;

type Story = StoryObj<typeof TemplateForm>;

export const Empty: Story = {
  render: (args) => ({
    components: { TemplateForm },
    setup() {
      return { args };
    },
    template: '<TemplateForm v-bind="args" />',
  }),
  args: {
    modelValue: createTemplateHelper(),
  },
};

export const ClickAndRead: Story = {
  render: (args) => ({
    components: { TemplateForm },
    setup() {
      return { args };
    },
    template: '<TemplateForm v-bind="args" />',
  }),
  args: {
    modelValue: createTemplateHelperFrom({
      id: '10aa85df-ff20-48c8-b07d-0382c9cd3b12',
      name: 'Click&Read : Suivis multi [ezupw+istex+panist]',
      tags: [
        { id: '0', name: 'ezPAARSE' },
        { id: '1', name: 'ezUnpaywall', color: '#00B94C' },
        { id: '2', name: 'Istex', color: '#BED031' },
        { id: '3', name: 'Panist', color: '#005F9F' },
      ],
      body: {
        version: 2,
        index: 'ezunpw*,istex*,panist*',
        dateField: 'datetime',
        filters: [
          {
            name: 'sid is clickandread',
            field: 'sid',
            isNot: false,
            value: 'clickandread',
          },
        ],
        layouts: [
          {
            figures: [
              {
                type: 'arc',
                slots: [0, 1, 2, 3],
                params: {
                  label: {
                    legend: null,
                    aggregation: { type: 'terms', field: 'ua' },
                  },
                  title: 'ezunpw : diag circulaire - navigateur',
                  value: {},
                  dataLabel: { format: 'percent', showLabel: true },
                },
                filters: [
                  {
                    name: '_index is ezunpw*',
                    field: '_index',
                    isNot: false,
                    value: 'ezunpw*',
                  },
                ],
              },
            ],
          },
          {
            figures: [
              {
                type: 'metric',
                slots: [0, 1],
                params: {
                  labels: [
                    { text: 'Requêtes', format: { type: 'number' } },
                    {
                      text: 'ApiKey',
                      aggregation: { type: 'cardinality', field: 'sid' },
                    },
                    {
                      text: 'De',
                      format: { type: 'date' },
                      aggregation: { type: 'min', field: 'date' },
                    },
                    {
                      text: 'à',
                      format: { type: 'date' },
                      aggregation: { type: 'max', field: 'date' },
                    },
                    {
                      text: 'Hôtes uniques',
                      format: { type: 'number' },
                      aggregation: { type: 'cardinality', field: 'host' },
                    },
                    {
                      text: 'DOI recherchés',
                      format: { type: 'number' },
                      aggregation: { type: 'sum', field: 'doi_count' },
                    },
                  ],
                },
                filters: [
                  {
                    name: '_index is ezunpw*',
                    field: '_index',
                    isNot: false,
                    value: 'ezunpw*',
                  },
                ],
              },
              {
                type: 'bar',
                slots: [2, 3],
                params: {
                  label: {
                    title: 'datetime',
                    aggregation: {
                      type: 'date_histogram',
                      field: '{{ dateField }}',
                    },
                  },
                  title: 'ezunpw : histo jour requêtes',
                  value: { title: 'Count' },
                  dataLabel: { format: 'numeric', showLabel: false },
                  invertAxis: false,
                },
                filters: [
                  {
                    name: '_index is ezunpw*',
                    field: '_index',
                    isNot: false,
                    value: 'ezunpw*',
                  },
                ],
              },
            ],
          },
          {
            figures: [
              {
                type: 'metric',
                slots: [0, 1],
                params: {
                  labels: [
                    { text: 'Requêtes', format: { type: 'number' } },
                    {
                      text: 'sid',
                      aggregation: { type: 'cardinality', field: 'sid' },
                    },
                    {
                      text: 'De',
                      format: { type: 'date' },
                      aggregation: { type: 'min', field: 'date' },
                    },
                    {
                      text: 'à',
                      format: { type: 'date' },
                      aggregation: { type: 'max', field: 'date' },
                    },
                    {
                      text: 'Hôtes uniques',
                      format: { type: 'number' },
                      aggregation: { type: 'cardinality', field: 'host' },
                    },
                  ],
                },
                filters: [
                  {
                    name: '_index is istex*',
                    field: '_index',
                    isNot: false,
                    value: 'istex*',
                  },
                ],
              },
              {
                type: 'bar',
                slots: [2, 3],
                params: {
                  label: {
                    title: 'datetime',
                    aggregation: {
                      type: 'date_histogram',
                      field: '{{ dateField }}',
                    },
                  },
                  title: 'istex : histo jour requêtes',
                  value: { title: 'Count' },
                  dataLabel: { format: 'numeric', showLabel: false },
                  invertAxis: false,
                },
                filters: [
                  {
                    name: '_index is istex*',
                    field: '_index',
                    isNot: false,
                    value: 'istex*',
                  },
                ],
              },
            ],
          },
          {
            figures: [
              {
                type: 'metric',
                slots: [0, 1],
                params: {
                  labels: [
                    { text: 'Requêtes', format: { type: 'number' } },
                    {
                      text: 'sid',
                      aggregation: { type: 'cardinality', field: 'sid' },
                    },
                    {
                      text: 'De',
                      format: { type: 'date' },
                      aggregation: { type: 'min', field: 'date' },
                    },
                    {
                      text: 'à',
                      format: { type: 'date' },
                      aggregation: { type: 'max', field: 'date' },
                    },
                    {
                      text: 'Hôtes uniques',
                      format: { type: 'number' },
                      aggregation: { type: 'cardinality', field: 'host' },
                    },
                  ],
                },
                filters: [
                  {
                    name: '_index is panist*',
                    field: '_index',
                    isNot: false,
                    value: 'panist*',
                  },
                ],
              },
              {
                type: 'bar',
                slots: [2, 3],
                params: {
                  label: {
                    title: 'datetime',
                    aggregation: {
                      type: 'date_histogram',
                      field: '{{ dateField }}',
                    },
                  },
                  title: 'panist : histo jour requêtes',
                  value: { title: 'Count' },
                  dataLabel: { format: 'numeric', showLabel: false },
                  invertAxis: false,
                },
                filters: [
                  {
                    name: '_index is panist*',
                    field: '_index',
                    isNot: false,
                    value: 'panist*',
                  },
                ],
              },
            ],
          },
        ],
      },
      createdAt: new Date('2024-10-18T07:40:59.688Z'),
      updatedAt: new Date('2024-10-24T12:31:40.172Z'),
    }),
  },
};

export const Doranum: Story = {
  render: (args) => ({
    components: { TemplateForm },
    setup() {
      return { args };
    },
    template: '<TemplateForm v-bind="args" />',
  }),
  args: {
    modelValue: createTemplateHelperFrom({
      id: '91bf7d4e-83e8-4e1b-be69-6fb0dbe6eee9',
      name: 'DORANUM',
      tags: [{ id: '0', name: 'ezPAARSE' }],
      body: {
        version: 2,
        index: 'cnrs-doranum*',
        dateField: 'datetime',
        filters: [
          {
            name: 'ua is not SemrushBot, UptimeRobot, etc.',
            field: 'ua',
            isNot: true,
            value: [
              'SemrushBot',
              'UptimeRobot',
              'MJ12bot',
              'Neticle Crawler',
              'Googlebot',
              'Other',
              'DotBot',
              'bingbot',
              'PetalBot',
              'AhrefsBot',
              'BLEXBot',
              'none',
              'Applebot',
              'Qwantify',
              'Xenu Link Sleuth',
              'Adsbot',
              'DataForSeoBot',
              'YandexBot',
              'crawler',
              'TwitterBot',
              'robot',
              'SemanticScholarBot',
              'CCBot',
              'Apple Mail',
              'Java',
              'WordPress',
              'Riddler',
              'AcademicBotRTU',
              'Python Requests',
              'Outlook',
              'GmailImageProxy',
              'Apache-HttpClient',
              'Thunderbird',
              'DuckDuckGo-Favicons-Bot',
              'Bytespider',
              'AwarioBot',
              'serpstatbot',
              'thesis-research-bot',
              'fidget-spinner-bot',
              'ClaudeBot',
              'PhxBot',
              'Amazonbot',
              'Timpibot',
              'FacebookBot',
              'ImagesiftBot',
              'fr_bot',
              'HeadlessChrome',
              'Nutch',
              'claudebot',
              'Mail.RU_Bot',
              'GPTBot',
              'FriendlyCrawler',
              'Server Crawler',
              'BacklinksExtendedBot',
              'Sidetrade indexer bot',
            ],
          },
        ],
        layouts: [
          {
            figures: [
              {
                data: '![ezMESURE](https://raw.githubusercontent.com/ezpaarse-project/ezpaarse-project.github.io/master/ezmesure/static/images/logo-ezMESURE-350.png)\n![DORANUM](https://ezmesure.couperin.org/api/assets/logos/baf802b8761cc9afb4a9682050ef8817.png)\n\n## Tableau de bord ezPAARSE - ezMESURE\nTableau de bord des usages de la plateforme DoRANum\n\nDoRANum est une plateforme de formation en ligne sur la gestion et le partage des données de la recherche, pour que chercheurs et doctorants puissent se former où ils veulent, quand vous veulent, et selon leurs besoins. L’offre se décline autour de nombreuses ressources pédagogiques numériques réparties dans 9 thématiques générales et plusieurs disciplines.\n\nhttps://doranum.fr/',
                type: 'md',
                slots: [0, 1, 2, 3],
                params: {},
                filters: [],
              },
            ],
          },
          {
            figures: [
              {
                type: 'metric',
                slots: [0, 1],
                params: {
                  labels: [
                    { text: 'Total des accès', format: { type: 'number' } },
                    {
                      text: 'Plateformes',
                      aggregation: { type: 'cardinality', field: 'platform' },
                    },
                    {
                      text: 'Ressources en ligne',
                      aggregation: {
                        type: 'cardinality',
                        field: 'publication_title',
                      },
                    },
                    {
                      text: 'Période du',
                      format: { type: 'date' },
                      aggregation: { type: 'min', field: 'datetime' },
                    },
                    {
                      text: 'au',
                      format: { type: 'date' },
                      aggregation: { type: 'max', field: 'datetime' },
                    },
                  ],
                },
                filters: [],
              },
              {
                type: 'bar',
                slots: [2, 3],
                params: {
                  label: {
                    aggregation: { type: 'date_histogram', field: 'datetime' },
                  },
                  title: 'Histogramme',
                  value: { title: 'Count' },
                  dataLabel: { format: 'numeric' },
                },
                filters: [],
              },
            ],
          },
          {
            figures: [
              {
                type: 'arc',
                slots: [0],
                params: {
                  label: {
                    title: 'rtype',
                    aggregation: { type: 'terms', field: 'rtype', size: 3 },
                  },
                  title: 'Type de consultation',
                  value: {},
                  dataLabel: { format: 'percent', showLabel: true },
                },
                filters: [],
              },
              {
                type: 'arc',
                slots: [1],
                params: {
                  label: {
                    title: 'mime',
                    aggregation: { type: 'terms', field: 'mime', size: 3 },
                  },
                  title: 'format',
                  value: {},
                  dataLabel: { format: 'percent', showLabel: true },
                },
                filters: [],
              },
              {
                type: 'table',
                slots: [2],
                params: {
                  title: 'Total des consultations par type',
                  columns: [
                    {
                      header: 'type de consultation',
                      metric: false,
                      aggregation: { type: 'terms', field: 'rtype', size: 2 },
                    },
                    {
                      header: 'Count',
                      metric: true,
                      styles: { halign: 'right', valign: 'top' },
                    },
                  ],
                  total: true,
                },
                filters: [],
              },
              {
                type: 'table',
                slots: [3],
                params: {
                  title: 'Total des consultations par format',
                  columns: [
                    {
                      header: 'format',
                      metric: false,
                      aggregation: { type: 'terms', field: 'mime' },
                    },
                    {
                      header: 'Count',
                      metric: true,
                      styles: { halign: 'right', valign: 'top' },
                    },
                  ],
                  total: true,
                },
                filters: [],
              },
            ],
          },
          {
            figures: [
              {
                type: 'arc',
                slots: [0, 1, 2, 3],
                params: {
                  label: {
                    title: 'navigateur',
                    aggregation: { type: 'terms', field: 'ua', size: 5 },
                  },
                  title: 'user-agent navigateur utilisé',
                  value: {},
                  dataLabel: { format: 'percent', showLabel: true },
                },
                filters: [],
              },
            ],
          },
          {
            figures: [
              {
                type: 'table',
                slots: [0, 1, 2, 3],
                params: {
                  title: 'top {{ length }} des ressources consultées',
                  columns: [
                    {
                      header: 'Titre de la ressource',
                      metric: false,
                      aggregation: {
                        type: 'terms',
                        field: 'publication_title',
                        size: 20,
                      },
                    },
                    {
                      header: 'DOI',
                      metric: false,
                      aggregation: { type: 'terms', field: 'doi', size: 1 },
                    },
                    {
                      header: 'count',
                      metric: true,
                      styles: { halign: 'right', valign: 'top' },
                    },
                  ],
                  total: true,
                },
                filters: [],
              },
            ],
          },
          {
            figures: [
              {
                type: 'arc',
                slots: [0, 1, 2, 3],
                params: {
                  label: {
                    title: 'referrer',
                    aggregation: { type: 'terms', field: 'referrer' },
                  },
                  title: 'Provenance des visiteurs (referrer)',
                  value: {},
                  dataLabel: { format: 'percent', showLabel: true },
                },
                filters: [],
              },
            ],
          },
        ],
      },
      createdAt: new Date('2024-07-12T06:47:16.022Z'),
      updatedAt: new Date('2024-10-15T07:38:40.444Z'),
    }),
  },
};
