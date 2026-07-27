// oxlint-disable no-default-export
import type { Meta } from '@storybook/vue3-vite';
import {
  createTemplateHelper,
  createTemplateHelperFrom,
} from '~sdk/helpers/templates';

import { useStory } from '~/__mocks__/utils';

import TemplateForm from './Form.vue';

const meta: Meta<typeof TemplateForm> = {
  component: TemplateForm,
  title: 'Template/Form',
};

const { defineStory } = useStory(meta);

export default meta;

export const Empty = defineStory({
  modelValue: createTemplateHelper(),
});

export const ClickAndRead = defineStory({
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
                  field: '_index',
                  isNot: false,
                  name: '_index is ezunpw*',
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
                  field: '_index',
                  isNot: false,
                  name: '_index is ezunpw*',
                  value: 'ezunpw*',
                },
              ],
              params: {
                labels: [
                  { format: { type: 'number' }, text: 'Requêtes' },
                  {
                    aggregation: { field: 'sid', type: 'cardinality' },
                    text: 'ApiKey',
                  },
                  {
                    aggregation: { field: 'date', type: 'min' },
                    format: { type: 'date' },
                    text: 'De',
                  },
                  {
                    aggregation: { field: 'date', type: 'max' },
                    format: { type: 'date' },
                    text: 'à',
                  },
                  {
                    aggregation: { field: 'host', type: 'cardinality' },
                    format: { type: 'number' },
                    text: 'Hôtes uniques',
                  },
                  {
                    aggregation: { field: 'doi_count', type: 'sum' },
                    format: { type: 'number' },
                    text: 'DOI recherchés',
                  },
                ],
              },
              slots: [0, 1],
              type: 'metric',
            },
            {
              filters: [
                {
                  field: '_index',
                  isNot: false,
                  name: '_index is ezunpw*',
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
                  field: '_index',
                  isNot: false,
                  name: '_index is istex*',
                  value: 'istex*',
                },
              ],
              params: {
                labels: [
                  { format: { type: 'number' }, text: 'Requêtes' },
                  {
                    aggregation: { field: 'sid', type: 'cardinality' },
                    text: 'sid',
                  },
                  {
                    aggregation: { field: 'date', type: 'min' },
                    format: { type: 'date' },
                    text: 'De',
                  },
                  {
                    aggregation: { field: 'date', type: 'max' },
                    format: { type: 'date' },
                    text: 'à',
                  },
                  {
                    aggregation: { field: 'host', type: 'cardinality' },
                    format: { type: 'number' },
                    text: 'Hôtes uniques',
                  },
                ],
              },
              slots: [0, 1],
              type: 'metric',
            },
            {
              filters: [
                {
                  field: '_index',
                  isNot: false,
                  name: '_index is istex*',
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
                  field: '_index',
                  isNot: false,
                  name: '_index is panist*',
                  value: 'panist*',
                },
              ],
              params: {
                labels: [
                  { format: { type: 'number' }, text: 'Requêtes' },
                  {
                    aggregation: { field: 'sid', type: 'cardinality' },
                    text: 'sid',
                  },
                  {
                    aggregation: { field: 'date', type: 'min' },
                    format: { type: 'date' },
                    text: 'De',
                  },
                  {
                    aggregation: { field: 'date', type: 'max' },
                    format: { type: 'date' },
                    text: 'à',
                  },
                  {
                    aggregation: { field: 'host', type: 'cardinality' },
                    format: { type: 'number' },
                    text: 'Hôtes uniques',
                  },
                ],
              },
              slots: [0, 1],
              type: 'metric',
            },
            {
              filters: [
                {
                  field: '_index',
                  isNot: false,
                  name: '_index is panist*',
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
});

export const Doranum = defineStory({
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
                  { format: { type: 'number' }, text: 'Total des accès' },
                  {
                    aggregation: { field: 'platform', type: 'cardinality' },
                    text: 'Plateformes',
                  },
                  {
                    aggregation: {
                      field: 'publication_title',
                      type: 'cardinality',
                    },
                    text: 'Ressources en ligne',
                  },
                  {
                    aggregation: { field: 'datetime', type: 'min' },
                    format: { type: 'date' },
                    text: 'Période du',
                  },
                  {
                    aggregation: { field: 'datetime', type: 'max' },
                    format: { type: 'date' },
                    text: 'au',
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
                    aggregation: { field: 'rtype', size: 2, type: 'terms' },
                    header: 'type de consultation',
                    metric: false,
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
                    aggregation: { field: 'mime', type: 'terms' },
                    header: 'format',
                    metric: false,
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
                    aggregation: {
                      field: 'publication_title',
                      size: 20,
                      type: 'terms',
                    },
                    header: 'Titre de la ressource',
                    metric: false,
                  },
                  {
                    aggregation: { field: 'doi', size: 1, type: 'terms' },
                    header: 'DOI',
                    metric: false,
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
});
