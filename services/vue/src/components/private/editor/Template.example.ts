import {
  createTemplateHelper,
  createTemplateHelperFrom,
} from '~sdk/helpers/templates';

export const emptyTemplate = createTemplateHelper().body;

export const existingTemplate = createTemplateHelperFrom({
  body: {
    dateField: 'datetime',
    filters: [
      {
        isNot: false,
        name: 'filter-1',
        raw: {
          query_string: {
            query: '-(host:XXX.XX.XXX.X AND sid:"istex-api-harvester")',
          },
        },
      },
      {
        isNot: false,
        name: 'filter-2',
        raw: {
          bool: {
            should: [{ query_string: { query: '-(sid:test*)' } }],
          },
        },
      },
      {
        isNot: false,
        name: 'filter-3',
        raw: {
          bool: {
            must_not: {
              bool: {
                must: [
                  {
                    prefix: {
                      referer: { value: 'https://revue-sommaire.istex.fr' },
                    },
                  },
                  { match: { mime: 'JSON' } },
                ],
              },
            },
          },
        },
      },
      {
        isNot: false,
        name: 'filter-4',
        raw: { range: { status: { gte: 200, lt: 299 } } },
      },
      {
        field: 'host',
        isNot: true,
        name: 'host is not XX.XXX.XX.XX, YY.YYY.YY.YYY, etc.',
        value: ['XX.XXX.XX.XX', 'YY.YYY.YY.YYY', 'ZZ.Z.Z.ZZ'],
      },
      {
        isNot: true,
        name: 'filter-not-2',
        raw: { match_phrase: { publication_date: { query: 'uuuu' } } },
      },
      {
        isNot: true,
        name: 'filter-not-3',
        raw: {
          match_phrase: {
            owner: {
              query:
                'IP - accès temporaire car pas d acces à Janus et en télétravail',
            },
          },
        },
      },
      {
        field: 'owner',
        isNot: true,
        name: 'owner is not vpn windows inist, vpn linux inist, etc.',
        value: ['vpn windows inist', 'vpn linux inist'],
      },
      {
        field: 'sid',
        isNot: true,
        name: 'sid is not istex-exchange, tdm-alignement-pf, etc.',
        value: ['istex-exchange', 'tdm-alignement-pf', 'ezs-istex'],
      },
      {
        field: 'owner',
        isNot: true,
        name: 'owner is not ranges postes inist, machine kiosque INIST, etc.',
        value: [
          'ranges postes inist',
          'machine kiosque INIST',
          'Accès externe via proxy INIST',
          'Adresses locales INIST',
        ],
      },
      {
        isNot: true,
        name: 'filter-not-7',
        raw: { match_phrase: { sid: { query: 'ezpaarse' } } },
      },
      {
        isNot: true,
        name: 'filter-not-8',
        raw: { match_phrase: { rtype: { query: 'OPENURL' } } },
      },
      {
        field: 'sid',
        isNot: true,
        name: 'sid is not uptimerobot',
        value: 'uptimerobot',
      },
      {
        isNot: true,
        name: 'filter-not-10',
        raw: {
          bool: {
            filter: [],
            must: [
              {
                query_string: {
                  analyze_wildcard: true,
                  query:
                    'user-agent:(Elastic-Heartbeat* OR *Yandex*) OR ua:(other OR Googlebot OR DataForSeoBot OR PetalBot OR UptimeRobot OR SemrushBot OR MauiBot OR Adsbot OR LTX71 OR BLEXBot OR bingbot OR Applebot OR Amazonbot) OR sid:(other OR uptimerobot)',
                  time_zone: 'Europe/Paris',
                },
              },
            ],
            must_not: [],
            should: [],
          },
        },
      },
    ],
    index: 'istex*',
    layouts: [
      {
        figures: [
          {
            data: "### Tableau de bord des usages périodiques de la plateforme ISTEX \n\nCe rapport  présente les statistiques d'usages périodiques de la plateforme ISTEX.\nIl propose des visualisations consolidées de l'ensemble des consultations réalisées par les établissements de l'ESR.\nCe tableau de bord permet aussi de mesurer les deux grands types d'usages de la plateforme ISTEX : l'usage documentaire et l'usage pour la fouille de textes.\n\n![ezMESURE](https://raw.githubusercontent.com/ezpaarse-project/ezpaarse-project.github.io/master/ezmesure/static/images/logo-ezMESURE-350.png)\n![ISTEX](https://raw.githubusercontent.com/ezpaarse-project/ezpaarse-project.github.io/master/ezmesure/static/images/ISTEX_350.jpg)\n### 1. Méthodologie\nCette étude est basée sur le traitement des fichiers de logs d’accès collectés localement via l'api ISTEX et analysés avec le logiciel libre ezPAARSE. Les résultats obtenus ont été mis à disposition dans la plateforme nationale du projet ezMESURE, puis présentés via l’outil de visualisation Kibana.\n\n### 2. Restriction de diffusion\nLes données d’usage contenues dans ce document sont des informations à caractères sensibles. \nElles ne doivent en aucun cas faire l’objet d’une diffusion à un tiers et ne doivent pas être utilisées sans l’autorisation écrite du CNRS.\n",
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
                  aggregation: { field: 'istex-id', type: 'cardinality' },
                  format: { type: 'number' },
                  text: 'Etablissements',
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
                {
                  aggregation: { field: 'owner', type: 'cardinality' },
                  format: { type: 'number' },
                  text: 'unique count of owner',
                },
              ],
            },
            slots: [0, 1, 2, 3],
            type: 'metric',
          },
        ],
      },
      {
        figures: [
          {
            filters: [],
            params: {
              color: {
                aggregation: {
                  raw: {
                    filters: {
                      filters: {
                        Autre: {
                          bool: {
                            filter: [],
                            must: [
                              {
                                query_string: {
                                  analyze_wildcard: true,
                                  query:
                                    'ua:("other" OR "PetalBot" OR "UptimeRobot" OR "SemrushBot" OR "MauiBot" OR "Adsbot" OR "LTX71" OR "BLEXBot" OR "bingbot" OR "Applebot") OR sid:("other" OR "uptimerobot" OR "ezs-istex")',
                                  time_zone: 'Europe/Paris',
                                },
                              },
                            ],
                            must_not: [],
                            should: [],
                          },
                        },
                        Documentaire: {
                          bool: {
                            filter: [],
                            must: [
                              {
                                query_string: {
                                  analyze_wildcard: true,
                                  query:
                                    '(ua:("Firefox" OR "Chrome" OR "Safari" OR "IE" OR "Vivaldi" OR "Edge" OR "Mobile Safari" OR "Chromium" OR "Opera" OR "Samsung Internet" OR "chrome Mobile" OR "Chrome Mobile iOS" OR "iceweasel" OR "SeaMonkey" OR "Iron") OR sid : ("clickandread" OR "hal" OR "istex-browser-addon" OR "focus" OR "smash" OR "ebsco,istex-view" OR "istex-widgets" OR "syrtis" OR "vibad" OR "ebsco" OR "ILL-ESRF" OR "istex-api-demo" OR "istex-view" OR "google,istex-view" OR "bu-ujm" OR "sfx/upn" OR "sfx/univ-rennes2.fr" OR "istex-www" OR "istex-browser-addon,oa" OR "lissa" OR "sfx/dau" OR "sfx/psl,istex-view" OR "istex-browser-addon,vibad" OR "istex-browser-addon,hal" OR "istex-browser-addon,clickandread" OR "primo/UPN" OR "istex-browser-addon,focus" OR "istex-browser-addon,istex-browser-addon" OR "istex-browser-addon,ebsco" OR "istex-browser-addon?sid=istex-browser-addon" OR "ebsco,istex-view\'A=0" OR "ebsco,istex-view\'")) NOT (sid:"istex-dl")',
                                  time_zone: 'Europe/Paris',
                                },
                              },
                            ],
                            must_not: [],
                            should: [],
                          },
                        },
                        'Fouille de texte': {
                          bool: {
                            filter: [],
                            must: [
                              {
                                query_string: {
                                  analyze_wildcard: true,
                                  query:
                                    'ua:("Node.js" OR "Python-urllib" OR "libwww-perl" OR "Wget" OR "curl" OR "Python Requests" OR "Java" OR "Apache-HttpClient") OR sid:("istex-api-harvester" OR "istex-dl" OR "scodex-harvest-corpus" OR "tdm-alignement-pf" OR "tdm-ajoute-id")',
                                  time_zone: 'Europe/Paris',
                                },
                              },
                            ],
                            must_not: [],
                            should: [],
                          },
                        },
                        'Non renseigné': {
                          bool: {
                            filter: [],
                            must: [
                              {
                                query_string: {
                                  analyze_wildcard: true,
                                  query: 'ua:none AND sid:none',
                                  time_zone: 'Europe/Paris',
                                },
                              },
                            ],
                            must_not: [],
                            should: [],
                          },
                        },
                      },
                    },
                  },
                },
              },
              dataLabel: {
                format: 'percent',
                position: 'in',
                showLabel: false,
              },
              label: {
                aggregation: { field: 'datetime', type: 'date_histogram' },
              },
              title: 'ezpaarse : générique histogramme',
              value: { title: 'Count' },
            },
            slots: [0, 1, 2, 3],
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
                aggregation: {
                  raw: {
                    filters: {
                      filters: {
                        Autre: {
                          bool: {
                            filter: [],
                            must: [
                              {
                                query_string: {
                                  analyze_wildcard: true,
                                  query:
                                    'ua:("other" OR "PetalBot" OR "UptimeRobot" OR "SemrushBot" OR "MauiBot" OR "Adsbot" OR "LTX71" OR "BLEXBot" OR "bingbot" OR "Applebot") OR sid:("other" OR "uptimerobot" OR "ezs-istex")',
                                  time_zone: 'Europe/Paris',
                                },
                              },
                            ],
                            must_not: [],
                            should: [],
                          },
                        },
                        Documentaire: {
                          bool: {
                            filter: [],
                            must: [
                              {
                                query_string: {
                                  analyze_wildcard: true,
                                  query:
                                    '(ua:("Firefox" OR "Chrome" OR "Safari" OR "IE" OR "Vivaldi" OR "Edge" OR "Mobile Safari" OR "Chromium" OR "Opera" OR "Samsung Internet" OR "chrome Mobile" OR "Chrome Mobile iOS" OR "iceweasel" OR "SeaMonkey" OR "Iron") OR sid : ("clickandread" OR "hal" OR "istex-browser-addon" OR "focus" OR "smash" OR "ebsco,istex-view" OR "istex-widgets" OR "syrtis" OR "vibad" OR "ebsco" OR "ILL-ESRF" OR "istex-api-demo" OR "istex-view" OR "google,istex-view" OR "bu-ujm" OR "sfx/upn" OR "sfx/univ-rennes2.fr" OR "istex-www" OR "istex-browser-addon,oa" OR "lissa" OR "sfx/dau" OR "sfx/psl,istex-view" OR "istex-browser-addon,vibad" OR "istex-browser-addon,hal" OR "istex-browser-addon,clickandread" OR "primo/UPN" OR "istex-browser-addon,focus" OR "istex-browser-addon,istex-browser-addon" OR "istex-browser-addon,ebsco" OR "istex-browser-addon?sid=istex-browser-addon" OR "ebsco,istex-view\'A=0" OR "ebsco,istex-view\'")) NOT (sid:"istex-dl")',
                                  time_zone: 'Europe/Paris',
                                },
                              },
                            ],
                            must_not: [],
                            should: [],
                          },
                        },
                        'Fouille de texte': {
                          bool: {
                            filter: [],
                            must: [
                              {
                                query_string: {
                                  analyze_wildcard: true,
                                  query:
                                    'ua:("Node.js" OR "Python-urllib" OR "libwww-perl" OR "Wget" OR "curl" OR "Python Requests" OR "Java" OR "Apache-HttpClient") OR sid:("istex-api-harvester" OR "istex-dl" OR "scodex-harvest-corpus" OR "tdm-alignement-pf" OR "tdm-ajoute-id")',
                                  time_zone: 'Europe/Paris',
                                },
                              },
                            ],
                            must_not: [],
                            should: [],
                          },
                        },
                        'Non renseigné': {
                          bool: {
                            filter: [],
                            must: [
                              {
                                query_string: {
                                  analyze_wildcard: true,
                                  query: 'ua:none AND sid:none',
                                  time_zone: 'Europe/Paris',
                                },
                              },
                            ],
                            must_not: [],
                            should: [],
                          },
                        },
                      },
                    },
                  },
                },
                legend: null,
                title: 'plateformes',
              },
              title: 'documentaire/fouille de texte',
              value: {},
            },
            slots: [0, 2],
            type: 'arc',
          },
          {
            filters: [],
            params: {
              columns: [
                {
                  aggregation: {
                    field: 'istex_bundle_size',
                    size: 10,
                    type: 'terms',
                  },
                  header: 'Nombre de ressources téléchargées',
                  metric: false,
                },
                {
                  header: 'Value',
                  metric: true,
                  styles: { halign: 'right', valign: 'top' },
                },
              ],
              title: 'ressources téléchargées',
              total: false,
            },
            slots: [1, 3],
            type: 'table',
          },
        ],
      },
      {
        figures: [
          {
            filters: [],
            params: {
              color: {
                aggregation: { field: 'owner', type: 'terms' },
                title: 'établissements',
              },
              dataLabel: { format: 'percent', showLabel: true },
              label: { aggregation: { field: 'auth', type: 'terms' } },
              title: 'ip/fede établissements',
              value: {},
            },
            slots: [0, 1, 2, 3],
            type: 'bar',
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
                  aggregation: { field: 'ua', type: 'terms' },
                  header: 'user agent',
                  metric: false,
                },
                {
                  header: 'Total des accès',
                  metric: true,
                  styles: { halign: 'right', valign: 'top' },
                },
              ],
              title: 'accès par ua',
              total: false,
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
                aggregation: { field: 'mime', type: 'terms' },
                legend: null,
              },
              title: 'répartition par mime',
              value: {},
            },
            slots: [0, 2],
            type: 'arc',
          },
          {
            filters: [],
            params: {
              columns: [
                {
                  aggregation: { field: 'host', type: 'terms' },
                  header: 'host = ip',
                  metric: false,
                },
                {
                  header: 'total des accès',
                  metric: true,
                  styles: { halign: 'right', valign: 'top' },
                },
              ],
              title: 'host = ip',
              total: true,
            },
            slots: [1, 3],
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
                aggregation: { field: 'sid', type: 'terms' },
                legend: null,
              },
              title: 'sid',
              value: {},
            },
            slots: [0, 2],
            type: 'arc',
          },
          {
            filters: [],
            params: {
              columns: [
                {
                  aggregation: {
                    field: 'publication_title',
                    missing: 'Non renseigné',
                    type: 'terms',
                  },
                  header: 'titres',
                  metric: false,
                },
                {
                  header: 'count',
                  metric: true,
                  styles: { halign: 'right', valign: 'top' },
                },
              ],
              title: 'top {{ length }} des titres consultés',
              total: true,
            },
            slots: [1, 3],
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
                aggregation: { field: 'publisher_name', type: 'terms' },
                legend: null,
              },
              title: 'top {{ length }} corpus éditeurs',
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
  createdAt: new Date('2024-07-12T06:47:15.927Z'),
  id: 'e20bbbbc-4ffa-47ec-8c6b-8c9813d66a44',
  locale: 'fr',
  name: '2024-06-03 Istex',
  tags: [
    { id: '0', name: 'ezPAARSE' },
    { color: '#BED031', id: '1', name: 'Istex' },
  ],
  updatedAt: new Date('2024-10-24T12:31:30.504Z'),
}).body;
