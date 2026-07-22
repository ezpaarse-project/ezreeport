// oxlint-disable no-default-export
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import {
  createTemplateHelper,
  createTemplateHelperFrom,
} from '~sdk/helpers/templates';

import TemplateForm from './Form.vue';

const meta: Meta<typeof TemplateForm> = {
  component: TemplateForm,
  title: 'Template/Form',
};

export default meta;

type Story = StoryObj<typeof TemplateForm>;

export const Empty: Story = {
  args: {
    modelValue: createTemplateHelper(),
  },
  render: (args: unknown) => ({
    components: { TemplateForm },
    setup() {
      return { args };
    },
    template: '<TemplateForm v-bind="args" />',
  }),
};

export const ClickAndRead: Story = {
  args: {
    modelValue: createTemplateHelperFrom({
      body: {
        dateField: 'datetime',
        filters: [
          {
            field: 'sid',
            isNot: false,
            name: 'sid is clickandread',
            value: 'clickandread',
          },
        ],
        index: 'ezunpw*,istex*,panist*',
        layouts: [
          {
            figures: [
              {
                filters: [
                  {
                    name: '_index is ezunpw*',
                    field: '_index',
                    isNot: false,
                    value: 'ezunpw*',
                  },
                ],
                params: {
                  dataLabel: { format: 'percent', showLabel: true },
                  label: {
                    aggregation: { field: 'ua', type: 'terms' },
                    legend: null,
                  },
                  title: 'ezunpw : diag circulaire - navigateur',
                  value: {},
                },
                slots: [0, 1, 2, 3],
                type: 'arc',
              },
            ],
          },
          {
            figures: [
              {
                filters: [
                  {
                    name: '_index is ezunpw*',
                    field: '_index',
                    isNot: false,
                    value: 'ezunpw*',
                  },
                ],
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
                slots: [0, 1],
                type: 'metric',
              },
              {
                filters: [
                  {
                    name: '_index is ezunpw*',
                    field: '_index',
                    isNot: false,
                    value: 'ezunpw*',
                  },
                ],
                params: {
                  dataLabel: { format: 'numeric', showLabel: false },
                  invertAxis: false,
                  label: {
                    aggregation: {
                      field: '{{ dateField }}',
                      type: 'date_histogram',
                    },
                    title: 'datetime',
                  },
                  title: 'ezunpw : histo jour requêtes',
                  value: { title: 'Count' },
                },
                slots: [2, 3],
                type: 'bar',
              },
            ],
          },
          {
            figures: [
              {
                filters: [
                  {
                    name: '_index is istex*',
                    field: '_index',
                    isNot: false,
                    value: 'istex*',
                  },
                ],
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
                slots: [0, 1],
                type: 'metric',
              },
              {
                filters: [
                  {
                    name: '_index is istex*',
                    field: '_index',
                    isNot: false,
                    value: 'istex*',
                  },
                ],
                params: {
                  dataLabel: { format: 'numeric', showLabel: false },
                  invertAxis: false,
                  label: {
                    aggregation: {
                      field: '{{ dateField }}',
                      type: 'date_histogram',
                    },
                    title: 'datetime',
                  },
                  title: 'istex : histo jour requêtes',
                  value: { title: 'Count' },
                },
                slots: [2, 3],
                type: 'bar',
              },
            ],
          },
          {
            figures: [
              {
                filters: [
                  {
                    name: '_index is panist*',
                    field: '_index',
                    isNot: false,
                    value: 'panist*',
                  },
                ],
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
                slots: [0, 1],
                type: 'metric',
              },
              {
                filters: [
                  {
                    name: '_index is panist*',
                    field: '_index',
                    isNot: false,
                    value: 'panist*',
                  },
                ],
                params: {
                  dataLabel: { format: 'numeric', showLabel: false },
                  invertAxis: false,
                  label: {
                    aggregation: {
                      field: '{{ dateField }}',
                      type: 'date_histogram',
                    },
                    title: 'datetime',
                  },
                  title: 'panist : histo jour requêtes',
                  value: { title: 'Count' },
                },
                slots: [2, 3],
                type: 'bar',
              },
            ],
          },
        ],
        version: 2,
      },
      createdAt: new Date('2024-10-18T07:40:59.688Z'),
      id: '10aa85df-ff20-48c8-b07d-0382c9cd3b12',
      locale: 'fr',
      name: 'Click&Read : Suivis multi [ezupw+istex+panist]',
      tags: [
        { id: '0', name: 'ezPAARSE' },
        { color: '#00B94C', id: '1', name: 'ezUnpaywall' },
        { color: '#BED031', id: '2', name: 'Istex' },
        { color: '#005F9F', id: '3', name: 'Panist' },
      ],
      updatedAt: new Date('2024-10-24T12:31:40.172Z'),
    }),
  },
  render: (args: unknown) => ({
    components: { TemplateForm },
    setup() {
      return { args };
    },
    template: '<TemplateForm v-bind="args" />',
  }),
};

export const Doranum: Story = {
  args: {
    modelValue: createTemplateHelperFrom({
      body: {
        dateField: 'datetime',
        filters: [
          {
            field: 'ua',
            isNot: true,
            name: 'ua is not SemrushBot, UptimeRobot, etc.',
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
        index: 'cnrs-doranum*',
        layouts: [
          {
            figures: [
              {
                data: '![ezMESURE](https://raw.githubusercontent.com/ezpaarse-project/ezpaarse-project.github.io/master/ezmesure/static/images/logo-ezMESURE-350.png)\n![DORANUM](https://ezmesure.couperin.org/api/assets/logos/baf802b8761cc9afb4a9682050ef8817.png)\n\n## Tableau de bord ezPAARSE - ezMESURE\nTableau de bord des usages de la plateforme DoRANum\n\nDoRANum est une plateforme de formation en ligne sur la gestion et le partage des données de la recherche, pour que chercheurs et doctorants puissent se former où ils veulent, quand vous veulent, et selon leurs besoins. L’offre se décline autour de nombreuses ressources pédagogiques numériques réparties dans 9 thématiques générales et plusieurs disciplines.\n\nhttps://doranum.fr/',
                filters: [],
                params: {},
                slots: [0, 1, 2, 3],
                type: 'md',
              },
            ],
          },
          {
            figures: [
              {
                filters: [],
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
                slots: [0, 1],
                type: 'metric',
              },
              {
                filters: [],
                params: {
                  dataLabel: { format: 'numeric' },
                  label: {
                    aggregation: { field: 'datetime', type: 'date_histogram' },
                  },
                  title: 'Histogramme',
                  value: { title: 'Count' },
                },
                slots: [2, 3],
                type: 'bar',
              },
            ],
          },
          {
            figures: [
              {
                filters: [],
                params: {
                  dataLabel: { format: 'percent', showLabel: true },
                  label: {
                    aggregation: { field: 'rtype', size: 3, type: 'terms' },
                    title: 'rtype',
                  },
                  title: 'Type de consultation',
                  value: {},
                },
                slots: [0],
                type: 'arc',
              },
              {
                filters: [],
                params: {
                  dataLabel: { format: 'percent', showLabel: true },
                  label: {
                    aggregation: { field: 'mime', size: 3, type: 'terms' },
                    title: 'mime',
                  },
                  title: 'format',
                  value: {},
                },
                slots: [1],
                type: 'arc',
              },
              {
                filters: [],
                params: {
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
                  title: 'Total des consultations par type',
                  total: true,
                },
                slots: [2],
                type: 'table',
              },
              {
                filters: [],
                params: {
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
                  title: 'Total des consultations par format',
                  total: true,
                },
                slots: [3],
                type: 'table',
              },
            ],
          },
          {
            figures: [
              {
                filters: [],
                params: {
                  dataLabel: { format: 'percent', showLabel: true },
                  label: {
                    aggregation: { field: 'ua', size: 5, type: 'terms' },
                    title: 'navigateur',
                  },
                  title: 'user-agent navigateur utilisé',
                  value: {},
                },
                slots: [0, 1, 2, 3],
                type: 'arc',
              },
            ],
          },
          {
            figures: [
              {
                filters: [],
                params: {
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
                  title: 'top {{ length }} des ressources consultées',
                  total: true,
                },
                slots: [0, 1, 2, 3],
                type: 'table',
              },
            ],
          },
          {
            figures: [
              {
                filters: [],
                params: {
                  dataLabel: { format: 'percent', showLabel: true },
                  label: {
                    aggregation: { field: 'referrer', type: 'terms' },
                    title: 'referrer',
                  },
                  title: 'Provenance des visiteurs (referrer)',
                  value: {},
                },
                slots: [0, 1, 2, 3],
                type: 'arc',
              },
            ],
          },
        ],
        version: 2,
      },
      createdAt: new Date('2024-07-12T06:47:16.022Z'),
      id: '91bf7d4e-83e8-4e1b-be69-6fb0dbe6eee9',
      locale: 'fr',
      name: 'DORANUM',
      tags: [{ id: '0', name: 'ezPAARSE' }],
      updatedAt: new Date('2024-10-15T07:38:40.444Z'),
    }),
  },
  render: (args: unknown) => ({
    components: { TemplateForm },
    setup() {
      return { args };
    },
    template: '<TemplateForm v-bind="args" />',
  }),
};
