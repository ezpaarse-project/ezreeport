import { parseISO } from 'date-fns';
import type { GenerationQueueDataType } from '~common/types/queues';

const data: GenerationQueueDataType = {
  jobId: '2_bibcnrs',
  task: {
    id: '915d1f4b-40GenerationQueueDataType, 67-48a3-bf51-9b9e9267d3ec',
    name: 'bibcnrs  hebdo',
    template: {
      version: 2, index: 'b-cnrs-bibcnrs-ezpaarse*', dateField: 'datetime', filters: [], inserts: [],
    },
    targets: ['ezteam@couperin.org', 'martial.luc@inist.fr', 'julien.franck@inist.fr', 'bibcnrs@inist.fr', 'nego@inist.fr', 'claire.francois@inist.fr', 'michele.bonthoux@inist.fr', 'paolo.lai@inist.fr', 'nicolas.thouvenin@inist.fr', 'camille.gagny@inist.fr', 'laurent.schmitt@inist.fr', 'cecilia.fabry@inist.fr'],
    recurrence: 'WEEKLY',
    nextRun: parseISO('2024-12-09T06:00:00.189Z'),
    lastRun: parseISO('2024-12-02T06:00:00.189Z'),
    enabled: false,
    createdAt: parseISO('2024-07-12T12:16:06.575Z'),
    updatedAt: parseISO('2025-01-22T13:34:08.822Z'),
    extendedId: '0cf28465-230f-406f-b13f-45239226bad3',
    namespaceId: 'abba8400-1216-11eb-af77-ff33b5dd411e',
  },
  namespace: {
    id: 'abba8400-1216-11eb-af77-ff33b5dd411e',
    name: 'Inist-CNRS Service Négociations et Acquisitions',
    fetchLogin: { elastic: { username: 'report.abba8400-1216-11eb-af77-ff33b5dd411e' } },
    fetchOptions: { elastic: {} },
    logoId: 'd80d56af8ee12a08a4be022dd544dc2b.png',
    createdAt: parseISO('2024-02-19T10:02:27.707Z'),
    updatedAt: parseISO('2025-01-29T08:29:41.600Z'),
  },
  template: {
    id: '0cf28465-230f-406f-b13f-45239226bad3',
    name: 'ezpaarse bibcnrs enrich cnrs OA',
    hidden: true,
    tags: [{ name: 'ezPAARSE' }, { name: 'bibCNRS', color: '#001E3D' }],
    body: {
      version: 2,
      index: 'b-cnrs-bibcnrs-ezpaarse*',
      dateField: 'datetime',
      filters: [{ name: 'rtype does exists', field: 'rtype', isNot: false }, {
        name: 'mime is not DOC, MISC, etc.', field: 'mime', isNot: true, value: ['DOC', 'MISC'],
      }, {
        name: 'rtype is not SEARCH, OPENURL, etc.', field: 'rtype', isNot: true, value: ['SEARCH', 'OPENURL', 'TOC', 'BLAST', 'NOTICE', 'QUERY'],
      }],
      layouts: [{
        figures: [{
          data: "### Tableau de bord BIBCNRS \nCe rapport  est destiné à montrer les consultations d'articles en PDF ou HTML des 10 instituts du CNRS. \n\n[![ezMESURE](https://raw.githubusercontent.com/ezpaarse-project/ezpaarse-project.github.io/master/ezmesure/static/images/logo-ezMESURE-350.png)](https://ezmesure.couperin.org/)\n[![BIBCNRS](https://raw.githubusercontent.com/ezpaarse-project/ezpaarse-project.github.io/master/ezmesure/static/images/bibcnrs-logo-150.png)](https://bib.cnrs.fr/)\n\n### Depuis juillet 2021, la plateforme Web of Science a évolué techniquement et ne permet plus une analyse des logs d'accès avec ezPAARSE.\n\nLa plupart des requêtes se font sur une API de manière silencieuse pour le parseur. Pour connaitre les usages de la plateforme, il faut consulter le tableau DR COUNTER 5  \"Total item Investigation\" dans l'espace \"éditeur\" en filtrer à la plateforme Web of Science.  \n", type: 'md', slots: [0, 1, 2, 3], params: {}, filters: [],
        }],
      }, {
        figures: [{
          type: 'metric', slots: [0, 1, 2, 3], params: { labels: [{ text: 'total des accès', format: { type: 'number' } }, { text: 'Plateformes', format: { type: 'number' }, aggregation: { type: 'cardinality', field: 'platform' } }, { text: 'Titres de publications', format: { type: 'number' }, aggregation: { type: 'cardinality', field: 'publication_title' } }, { text: 'Période du', format: { type: 'date' }, aggregation: { type: 'min', field: 'datetime' } }, { text: 'au', format: { type: 'date' }, aggregation: { type: 'max', field: 'datetime' } }] }, filters: [],
        }],
      }, {
        figures: [{
          type: 'bar',
          slots: [0, 2],
          params: {
            color: { title: 'Portails', aggregation: { type: 'terms', field: 'portal' } }, label: { aggregation: { type: 'date_histogram', field: 'datetime' } }, title: 'bibcnrs-* : histogramme', value: { title: 'Count' },
          },
          filters: [],
        }, {
          type: 'table', slots: [1, 3], params: { title: 'bibcnrs-* : table consultations par instituts', columns: [{ header: 'bibcnrs portal', metric: false, aggregation: { type: 'terms', field: 'portal' } }, { header: 'nombre de consultations', metric: true, styles: { halign: 'right', valign: 'top' } }], total: false }, filters: [],
        }],
      }, {
        figures: [{
          type: 'arc',
          slots: [0, 2],
          params: {
            label: { title: 'plateformes', legend: null, aggregation: { type: 'terms', field: 'platform_name' } }, title: 'ezpaarse : générique les {{ length }} premières plateformes éditeur', value: {}, dataLabel: { format: 'percent', showLabel: true },
          },
          filters: [],
        }, {
          type: 'table',
          slots: [1, 3],
          params: {
            title: 'ezpaarse : générique les{{ length }} plateformes les plus consultées',
            columns: [{ header: 'plateforme', metric: false, aggregation: { type: 'terms', field: 'platform_name', size: 20 } }, {
              _: { dragged: false }, header: 'Value', metric: true, styles: { halign: 'right', valign: 'top' },
            }],
            total: false,
          },
          filters: [],
        }],
      }, {
        figures: [{
          type: 'arc',
          slots: [0],
          params: {
            label: { title: '', legend: null, aggregation: { type: 'terms', field: 'rtype' } }, title: 'bibcnrs-* : type de consultation', value: {}, dataLabel: { format: 'percent', showLabel: true },
          },
          filters: [],
        }, {
          type: 'table',
          slots: [1, 3],
          params: {
            title: 'bibcnrs-* : les{{ length }} premiers éditeurs',
            columns: [{ header: 'éditeurs', metric: false, aggregation: { type: 'terms', field: 'publisher_name', missing: 'Non renseigné' } }, {
              _: { dragged: false }, header: 'Value', metric: true, styles: { halign: 'right', valign: 'top' },
            }],
            total: false,
          },
          filters: [],
        }, {
          type: 'arc',
          slots: [2],
          params: {
            label: { legend: null, aggregation: { type: 'terms', field: 'mime' } }, title: 'bibcnrs-* : générique format', value: {}, dataLabel: { format: 'percent', showLabel: true },
          },
          filters: [],
        }],
      }, {
        figures: [{
          type: 'table',
          slots: [0, 1, 2, 3],
          params: {
            title: 'bibcnrs-* : {{ length }} titres de publication',
            columns: [{
              _: { dragged: false }, header: 'Titres de publication', metric: false, aggregation: { type: 'terms', field: 'publication_title', missing: 'Non renseigné' },
            }, {
              _: { dragged: false },
              header: 'Print identifier (ISSN ISBN)',
              metric: false,
              aggregation: {
                type: 'terms', field: 'print_identifier', size: 1, missing: 'Non renseigné',
              },
            }, {
              header: 'Online identifier (ISSN ISBN)',
              metric: false,
              aggregation: {
                type: 'terms', field: 'online_identifier', size: 1, missing: 'Non renseigné',
              },
            }, {
              _: { dragged: false }, header: 'Value', metric: true, styles: { halign: 'right', valign: 'top' },
            }],
            total: false,
          },
          filters: [],
        }],
      }, {
        figures: [{
          type: 'arc',
          slots: [0, 2],
          params: {
            label: { legend: null, aggregation: { type: 'terms', field: 'cnrsData.intituleUnite' } }, title: 'bibcnrs-* : les{{ length }} laboratoires qui consultent le plus', value: {}, dataLabel: { format: 'percent', showLabel: true },
          },
          filters: [],
        }, {
          type: 'arc',
          slots: [1, 3],
          params: {
            label: { legend: null, aggregation: { type: 'terms', field: 'cnrsData.delegationRegionaleLibelle', missing: 'Non renseigné' } }, title: 'bibcnrs-* :  délégations', value: {}, dataLabel: { format: 'percent', showLabel: true },
          },
          filters: [],
        }],
      }, {
        figures: [{
          type: 'table', slots: [0, 1, 2, 3], params: { title: 'bibcnrs : enrichissement UMR', columns: [{ header: 'Laboratoire', metric: false, aggregation: { type: 'terms', field: 'unit', size: 20 } }, { header: 'Nom', metric: false, aggregation: { type: 'terms', field: 'cnrsData.intituleUnite', size: 1 } }, { header: 'Effectifs', metric: false, aggregation: { type: 'terms', field: 'cnrsData.effectifUnite' } }, { header: 'nombre de consultations', metric: true }], total: false }, filters: [],
        }],
      }, {
        figures: [{
          type: 'table', slots: [0, 1, 2, 3], params: { title: 'bibcnrs : Detail Personnels UMR qui consultent le plus', columns: [{ header: 'Laboratoire', metric: false, aggregation: { type: 'terms', field: 'cnrsData.personnels_CH', size: 20 } }, { header: 'Nom', metric: false, aggregation: { type: 'terms', field: 'cnrsData.intituleUnite', size: 1 } }, { header: 'Chercheurs', metric: false, aggregation: { type: 'terms', field: 'cnrsData.personnels_CH', size: 20 } }, { header: 'Enseignants chercheurs', metric: false, aggregation: { type: 'terms', field: 'cnrsData.personnels_ENS_CH' } }, { header: 'Doctorants', metric: false, aggregation: { type: 'terms', field: 'cnrsData.personnels_DOCT' } }, { header: 'nombre de consultations', metric: true }], total: false }, filters: [],
        }],
      }, {
        figures: [{
          type: 'arc',
          slots: [0, 2],
          params: {
            label: { legend: null, aggregation: { type: 'terms', field: 'publication_date' } }, title: 'bibcnrs-* : les{{ length }} années les plus consultées', value: {}, dataLabel: { format: 'numeric', showLabel: true },
          },
          filters: [],
        }, {
          type: 'arc',
          slots: [1, 3],
          params: {
            label: { legend: null, aggregation: { type: 'terms', field: 'section', missing: 'Non renseigné' } }, title: 'bibcnrs-* :  section', value: {}, dataLabel: { format: 'percent', showLabel: true },
          },
          filters: [],
        }],
      }, {
        figures: [{
          type: 'arc',
          slots: [0],
          params: {
            label: { legend: null, aggregation: { type: 'terms', field: 'oa_status' } }, title: 'bibcnrs-* : OA statuts', value: {}, dataLabel: { format: 'percent', showLabel: true },
          },
          filters: [],
        }, {
          type: 'arc',
          slots: [1],
          params: {
            label: { legend: null, aggregation: { type: 'terms', field: 'is_oa' } }, title: 'bibcnrs-* : article is OA', value: {}, dataLabel: { format: 'percent', showLabel: true },
          },
          filters: [],
        }, {
          type: 'arc',
          slots: [2],
          params: {
            label: { legend: null, aggregation: { type: 'terms', field: 'journal_is_in_doaj' } }, title: 'bibcnrs-* : journal is in doaj', value: {}, dataLabel: { format: 'percent', showLabel: true },
          },
          filters: [],
        }, {
          type: 'arc',
          slots: [3],
          params: {
            label: { legend: null, aggregation: { type: 'terms', field: 'journal_is_oa' } }, title: 'bibcnrs-* :  journal is OA', value: {}, dataLabel: { format: 'percent', showLabel: true },
          },
          filters: [],
        }],
      }],
    },
    createdAt: parseISO('2024-07-12T06:47:15.598Z'),
    updatedAt: parseISO('2024-12-04T08:49:10.517Z'),
  },
  period: {
    start: parseISO('2024-12-23T00:00:00.000Z'),
    end: parseISO('2024-12-29T23:59:59.999Z'),
  },
  origin: 'tests',
  targets: ['tom.sublet@inist.fr'],
  writeActivity: false,
  printDebug: false,
};

export default data;
