import type { Meta, StoryObj } from '@storybook/vue3';

import { createTemplateHelper, createTemplateHelperFrom } from '~sdk/helpers/templates';

import EditorTemplate from './Template.vue';

const meta: Meta<typeof EditorTemplate> = {
  title: 'Template Editor/Template',
  component: EditorTemplate,
};

export default meta;

type Story = StoryObj<typeof EditorTemplate>;

export const Empty: Story = {
  render: (args) => ({
    components: { EditorTemplate },
    setup() {
      return { args };
    },
    template: '<EditorTemplate v-bind="args" />',
  }),
  args: {
    modelValue: createTemplateHelper().body,
  },
};

const template = createTemplateHelperFrom({
  id: 'e20bbbbc-4ffa-47ec-8c6b-8c9813d66a44',
  name: '2024-06-03 Istex',
  tags: [{ name: 'ezPAARSE' }, { name: 'Istex', color: '#BED031' }],
  body: {
    version: 2,
    index: 'istex*',
    dateField: 'datetime',
    filters: [{ name: 'filter-1', raw: { query_string: { query: '-(host:193.54.109.8 AND sid:"istex-api-harvester")' } }, isNot: false }, { name: 'filter-2', raw: { bool: { should: [{ query_string: { query: '-(sid:test*)' } }] } }, isNot: false }, { name: 'filter-3', raw: { bool: { must_not: { bool: { must: [{ prefix: { referer: { value: 'https://revue-sommaire.istex.fr' } } }, { match: { mime: 'JSON' } }] } } } }, isNot: false }, { name: 'filter-4', raw: { range: { status: { lt: 299, gte: 200 } } }, isNot: false }, {
      name: 'host is not 78.226.181.10, 91.169.59.212, etc.', field: 'host', isNot: true, value: ['78.226.181.10', '91.169.59.212', '10.2.5.13'],
    }, { name: 'filter-not-2', raw: { match_phrase: { publication_date: { query: 'uuuu' } } }, isNot: true }, { name: 'filter-not-3', raw: { match_phrase: { owner: { query: 'IP Mounir Habsaoui - accès temporaire car pas d acces à Janus et en télétravail' } } }, isNot: true }, {
      name: 'owner is not vpn windows inist, vpn linux inist, etc.', field: 'owner', isNot: true, value: ['vpn windows inist', 'vpn linux inist'],
    }, {
      name: 'sid is not istex-exchange, tdm-alignement-pf, etc.', field: 'sid', isNot: true, value: ['istex-exchange', 'tdm-alignement-pf', 'ezs-istex'],
    }, {
      name: 'owner is not ranges postes inist, machine kiosque INIST, etc.', field: 'owner', isNot: true, value: ['ranges postes inist', 'machine kiosque INIST', 'Accès externe via proxy INIST', 'Adresses locales INIST'],
    }, { name: 'filter-not-7', raw: { match_phrase: { sid: { query: 'ezpaarse' } } }, isNot: true }, { name: 'filter-not-8', raw: { match_phrase: { rtype: { query: 'OPENURL' } } }, isNot: true }, {
      name: 'sid is not uptimerobot', field: 'sid', isNot: true, value: 'uptimerobot',
    }, {
      name: 'filter-not-10',
      raw: {
        bool: {
          must: [{ query_string: { query: 'user-agent:(Elastic-Heartbeat* OR *Yandex*) OR ua:(other OR Googlebot OR DataForSeoBot OR PetalBot OR UptimeRobot OR SemrushBot OR MauiBot OR Adsbot OR LTX71 OR BLEXBot OR bingbot OR Applebot OR Amazonbot) OR sid:(other OR uptimerobot)', time_zone: 'Europe/Paris', analyze_wildcard: true } }], filter: [], should: [], must_not: [],
        },
      },
      isNot: true,
    }],
    layouts: [{
      figures: [{
        data: "### Tableau de bord des usages périodiques de la plateforme ISTEX \n\nCe rapport  présente les statistiques d'usages périodiques de la plateforme ISTEX.\nIl propose des visualisations consolidées de l'ensemble des consultations réalisées par les établissements de l'ESR.\nCe tableau de bord permet aussi de mesurer les deux grands types d'usages de la plateforme ISTEX : l'usage documentaire et l'usage pour la fouille de textes.\n\n![ezMESURE](https://raw.githubusercontent.com/ezpaarse-project/ezpaarse-project.github.io/master/ezmesure/static/images/logo-ezMESURE-350.png)\n![ISTEX](https://raw.githubusercontent.com/ezpaarse-project/ezpaarse-project.github.io/master/ezmesure/static/images/ISTEX_350.jpg)\n### 1. Méthodologie\nCette étude est basée sur le traitement des fichiers de logs d’accès collectés localement via l'api ISTEX et analysés avec le logiciel libre ezPAARSE. Les résultats obtenus ont été mis à disposition dans la plateforme nationale du projet ezMESURE, puis présentés via l’outil de visualisation Kibana.\n\n### 2. Restriction de diffusion\nLes données d’usage contenues dans ce document sont des informations à caractères sensibles. \nElles ne doivent en aucun cas faire l’objet d’une diffusion à un tiers et ne doivent pas être utilisées sans l’autorisation écrite du CNRS.\n", type: 'md', slots: [0, 1, 2, 3], params: {}, filters: [],
      }],
    }, {
      figures: [{
        type: 'metric', slots: [0, 1, 2, 3], params: { labels: [{ text: 'Total des accès', format: { type: 'number' } }, { text: 'Etablissements', format: { type: 'number' }, aggregation: { type: 'cardinality', field: 'istex-id' } }, { text: 'Période du', format: { type: 'date' }, aggregation: { type: 'min', field: 'datetime' } }, { text: 'au', format: { type: 'date' }, aggregation: { type: 'max', field: 'datetime' } }, { text: 'unique count of owner', format: { type: 'number' }, aggregation: { type: 'cardinality', field: 'owner' } }] }, filters: [],
      }],
    }, {
      figures: [{
        type: 'bar',
        slots: [0, 1, 2, 3],
        params: {
          color: {
            aggregation: {
              raw: {
                filters: {
                  filters: {
                    Autre: {
                      bool: {
                        must: [{ query_string: { query: 'ua:("other" OR "PetalBot" OR "UptimeRobot" OR "SemrushBot" OR "MauiBot" OR "Adsbot" OR "LTX71" OR "BLEXBot" OR "bingbot" OR "Applebot") OR sid:("other" OR "uptimerobot" OR "ezs-istex")', time_zone: 'Europe/Paris', analyze_wildcard: true } }], filter: [], should: [], must_not: [],
                      },
                    },
                    Documentaire: {
                      bool: {
                        must: [{ query_string: { query: "(ua:(\"Firefox\" OR \"Chrome\" OR \"Safari\" OR \"IE\" OR \"Vivaldi\" OR \"Edge\" OR \"Mobile Safari\" OR \"Chromium\" OR \"Opera\" OR \"Samsung Internet\" OR \"chrome Mobile\" OR \"Chrome Mobile iOS\" OR \"iceweasel\" OR \"SeaMonkey\" OR \"Iron\") OR sid : (\"clickandread\" OR \"hal\" OR \"istex-browser-addon\" OR \"focus\" OR \"smash\" OR \"ebsco,istex-view\" OR \"istex-widgets\" OR \"syrtis\" OR \"vibad\" OR \"ebsco\" OR \"ILL-ESRF\" OR \"istex-api-demo\" OR \"istex-view\" OR \"google,istex-view\" OR \"bu-ujm\" OR \"sfx/upn\" OR \"sfx/univ-rennes2.fr\" OR \"istex-www\" OR \"istex-browser-addon,oa\" OR \"lissa\" OR \"sfx/dau\" OR \"sfx/psl,istex-view\" OR \"istex-browser-addon,vibad\" OR \"istex-browser-addon,hal\" OR \"istex-browser-addon,clickandread\" OR \"primo/UPN\" OR \"istex-browser-addon,focus\" OR \"istex-browser-addon,istex-browser-addon\" OR \"istex-browser-addon,ebsco\" OR \"istex-browser-addon?sid=istex-browser-addon\" OR \"ebsco,istex-view'A=0\" OR \"ebsco,istex-view'\")) NOT (sid:\"istex-dl\")", time_zone: 'Europe/Paris', analyze_wildcard: true } }], filter: [], should: [], must_not: [],
                      },
                    },
                    'Non renseigné': {
                      bool: {
                        must: [{ query_string: { query: 'ua:none AND sid:none', time_zone: 'Europe/Paris', analyze_wildcard: true } }], filter: [], should: [], must_not: [],
                      },
                    },
                    'Fouille de texte': {
                      bool: {
                        must: [{ query_string: { query: 'ua:("Node.js" OR "Python-urllib" OR "libwww-perl" OR "Wget" OR "curl" OR "Python Requests" OR "Java" OR "Apache-HttpClient") OR sid:("istex-api-harvester" OR "istex-dl" OR "scodex-harvest-corpus" OR "tdm-alignement-pf" OR "tdm-ajoute-id")', time_zone: 'Europe/Paris', analyze_wildcard: true } }], filter: [], should: [], must_not: [],
                      },
                    },
                  },
                },
              },
            },
          },
          label: { aggregation: { type: 'date_histogram', field: 'datetime' } },
          title: 'ezpaarse : générique histogramme',
          value: { title: 'Count' },
          dataLabel: { format: 'percent', position: 'in', showLabel: false },
        },
        filters: [],
      }],
    }, {
      figures: [{
        type: 'arc',
        slots: [0, 2],
        params: {
          label: {
            title: 'plateformes',
            legend: null,
            aggregation: {
              raw: {
                filters: {
                  filters: {
                    Autre: {
                      bool: {
                        must: [{ query_string: { query: 'ua:("other" OR "PetalBot" OR "UptimeRobot" OR "SemrushBot" OR "MauiBot" OR "Adsbot" OR "LTX71" OR "BLEXBot" OR "bingbot" OR "Applebot") OR sid:("other" OR "uptimerobot" OR "ezs-istex")', time_zone: 'Europe/Paris', analyze_wildcard: true } }], filter: [], should: [], must_not: [],
                      },
                    },
                    Documentaire: {
                      bool: {
                        must: [{ query_string: { query: "(ua:(\"Firefox\" OR \"Chrome\" OR \"Safari\" OR \"IE\" OR \"Vivaldi\" OR \"Edge\" OR \"Mobile Safari\" OR \"Chromium\" OR \"Opera\" OR \"Samsung Internet\" OR \"chrome Mobile\" OR \"Chrome Mobile iOS\" OR \"iceweasel\" OR \"SeaMonkey\" OR \"Iron\") OR sid : (\"clickandread\" OR \"hal\" OR \"istex-browser-addon\" OR \"focus\" OR \"smash\" OR \"ebsco,istex-view\" OR \"istex-widgets\" OR \"syrtis\" OR \"vibad\" OR \"ebsco\" OR \"ILL-ESRF\" OR \"istex-api-demo\" OR \"istex-view\" OR \"google,istex-view\" OR \"bu-ujm\" OR \"sfx/upn\" OR \"sfx/univ-rennes2.fr\" OR \"istex-www\" OR \"istex-browser-addon,oa\" OR \"lissa\" OR \"sfx/dau\" OR \"sfx/psl,istex-view\" OR \"istex-browser-addon,vibad\" OR \"istex-browser-addon,hal\" OR \"istex-browser-addon,clickandread\" OR \"primo/UPN\" OR \"istex-browser-addon,focus\" OR \"istex-browser-addon,istex-browser-addon\" OR \"istex-browser-addon,ebsco\" OR \"istex-browser-addon?sid=istex-browser-addon\" OR \"ebsco,istex-view'A=0\" OR \"ebsco,istex-view'\")) NOT (sid:\"istex-dl\")", time_zone: 'Europe/Paris', analyze_wildcard: true } }], filter: [], should: [], must_not: [],
                      },
                    },
                    'Non renseigné': {
                      bool: {
                        must: [{ query_string: { query: 'ua:none AND sid:none', time_zone: 'Europe/Paris', analyze_wildcard: true } }], filter: [], should: [], must_not: [],
                      },
                    },
                    'Fouille de texte': {
                      bool: {
                        must: [{ query_string: { query: 'ua:("Node.js" OR "Python-urllib" OR "libwww-perl" OR "Wget" OR "curl" OR "Python Requests" OR "Java" OR "Apache-HttpClient") OR sid:("istex-api-harvester" OR "istex-dl" OR "scodex-harvest-corpus" OR "tdm-alignement-pf" OR "tdm-ajoute-id")', time_zone: 'Europe/Paris', analyze_wildcard: true } }], filter: [], should: [], must_not: [],
                      },
                    },
                  },
                },
              },
            },
          },
          title: 'documentaire/fouille de texte',
          value: {},
          dataLabel: { format: 'percent', showLabel: true },
        },
        filters: [],
      }, {
        type: 'table', slots: [1, 3], params: { title: 'ressources téléchargées', columns: [{ header: 'Nombre de ressources téléchargées', metric: false, aggregation: { type: 'terms', field: 'istex_bundle_size', size: 10 } }, { header: 'Value', metric: true, styles: { halign: 'right', valign: 'top' } }], total: false }, filters: [],
      }],
    }, {
      figures: [{
        type: 'bar',
        slots: [0, 1, 2, 3],
        params: {
          color: { title: 'établissements', aggregation: { type: 'terms', field: 'owner' } }, label: { aggregation: { type: 'terms', field: 'auth' } }, title: 'ip/fede établissements', value: {}, dataLabel: { format: 'percent', showLabel: true },
        },
        filters: [],
      }],
    }, {
      figures: [{
        type: 'table', slots: [0, 1, 2, 3], params: { title: 'accès par ua', columns: [{ header: 'user agent', metric: false, aggregation: { type: 'terms', field: 'ua' } }, { header: 'Total des accès', metric: true, styles: { halign: 'right', valign: 'top' } }], total: false }, filters: [],
      }],
    }, {
      figures: [{
        type: 'arc',
        slots: [0, 2],
        params: {
          label: { legend: null, aggregation: { type: 'terms', field: 'mime' } }, title: 'répartition par mime', value: {}, dataLabel: { format: 'percent', showLabel: true },
        },
        filters: [],
      }, {
        type: 'table', slots: [1, 3], params: { title: 'host = ip', columns: [{ header: 'host = ip', metric: false, aggregation: { type: 'terms', field: 'host' } }, { header: 'total des accès', metric: true, styles: { halign: 'right', valign: 'top' } }], total: true }, filters: [],
      }],
    }, {
      figures: [{
        type: 'arc',
        slots: [0, 2],
        params: {
          label: { legend: null, aggregation: { type: 'terms', field: 'sid' } }, title: 'sid', value: {}, dataLabel: { format: 'percent', showLabel: true },
        },
        filters: [],
      }, {
        type: 'table', slots: [1, 3], params: { title: 'top {{ length }} des titres consultés', columns: [{ header: 'titres', metric: false, aggregation: { type: 'terms', field: 'publication_title', missing: 'Non renseigné' } }, { header: 'count', metric: true, styles: { halign: 'right', valign: 'top' } }], total: true }, filters: [],
      }],
    }, {
      figures: [{
        type: 'arc',
        slots: [0, 1, 2, 3],
        params: {
          label: { legend: null, aggregation: { type: 'terms', field: 'publisher_name' } }, title: 'top {{ length }} corpus éditeurs', value: {}, dataLabel: { format: 'percent', showLabel: true },
        },
        filters: [],
      }],
    }],
  },
  createdAt: new Date('2024-07-12T06:47:15.927Z'),
  updatedAt: new Date('2024-10-24T12:31:30.504Z'),
});

export const FromTemplate: Story = {
  render: (args) => ({
    components: { EditorTemplate },
    setup() {
      return { args };
    },
    template: '<EditorTemplate v-bind="args" />',
  }),
  args: {
    modelValue: template.body,
  },
};
