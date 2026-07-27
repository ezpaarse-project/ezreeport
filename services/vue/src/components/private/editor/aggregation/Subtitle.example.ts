import type {
  FigureBaseAggregation,
  FigureRawAggregation,
} from '~sdk/helpers/aggregations';

export const mockBasicData: FigureBaseAggregation = {
  field: 'Count',
  type: 'sum',
};

export const mockRawData: FigureRawAggregation = {
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
};
