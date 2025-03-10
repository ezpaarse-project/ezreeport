import { parseISO } from 'date-fns';
import type { GenerationQueueDataType } from '~common/types/queues';

const data: GenerationQueueDataType = {
  jobId: '1_ddor',
  task: {
    id: 'ca65ea81-d855-4169-99f6-6e614e6776ea',
    name: 'bibcnrs rapport DDOR annuel',
    template: {
      version: 2, index: 'b-cnrs-bibcnrs-ezpaarse*', dateField: 'datetime', filters: [], inserts: [],
    },
    targets: ['ezteam@couperin.org', 'isabelle.didelot@inist.fr', 'michele.bonthoux@inist.fr', 'patrice.bellot@cnrs-dir.fr', 'Jean-Jacques.BESSOULE@cnrs.fr', 'helein@math.univ-paris-diderot.fr', 'benoit.pier@cnrs-dir.fr', 'sylvie.rousset@cnrs.fr', 'Laurence.ELKHOURI@cnrs-dir.fr', 'cecilia.fabry@inist.fr', 'claire.francois@inist.fr', 'paolo.lai@inist.fr', 'laurent.schmitt@inist.fr', 'nicolas.thouvenin@inist.fr', 'christine.weil-miko@inist.fr', 'mathieu.grives@cnrs.fr', 'Laurent.LELLOUCH@cnrs-dir.fr', 'astrid.aschehoug@cnrs.fr', 'didier.bouchon@cnrs.fr', 'nathalie.pothier@cnrs-orleans.fr', 'irini.paltani-sargologos@cnrs.fr', 'serge.bauin@cnrs.fr', 'xavier.launois@inist.fr', 'romane.lesiuk@inist.fr', 'mikael.kepenekian@cnrs.fr', 'florent.potier@inist.fr', 'melanie.marcon@inist.fr'],
    recurrence: 'YEARLY',
    nextRun: parseISO('2026-01-02T00:00:00.000Z'),
    lastRun: null,
    enabled: true,
    createdAt: parseISO('2024-07-15T13:21:47.517Z'),
    updatedAt: parseISO('2025-01-10T08:08:36.744Z'),
    extendedId: '5a44307f-e3cb-468c-8adf-dc6262c89c66',
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
    id: '5a44307f-e3cb-468c-8adf-dc6262c89c66',
    name: 'Bibcnrs rapport DDOR ',
    hidden: true,
    tags: [{ name: 'ezPAARSE' }, { name: 'bibCNRS', color: '#001E3D' }],
    body: {
      version: 2,
      index: 'b-cnrs-bibcnrs-ezpaarse*',
      dateField: 'datetime',
      filters: [{
        name: 'rtype is ARTICLE', field: 'rtype', isNot: false, value: 'ARTICLE',
      }, {
        name: 'mime is not DOC, MISC, etc.', field: 'mime', isNot: true, value: ['DOC', 'MISC'],
      }],
      layouts: [{
        figures: [{
          data: '### Rapport des consultations BibCNRS\n\n[![ezMESURE](https://raw.githubusercontent.com/ezpaarse-project/ezpaarse-project.github.io/master/ezmesure/static/images/logo-ezMESURE-350.png)](https://ezmesure.couperin.org/)\n[![BibCNRS](https://raw.githubusercontent.com/ezpaarse-project/ezpaarse-project.github.io/master/ezmesure/static/images/bibcnrs-logo-150.png)](https://bib.cnrs.fr/)\n\n### Informations\n\nCe rapport comporte les données d’usage des ressources électroniques mises à disposition sur BibCNRS.\nIl a été constitué grâce aux outils EzPaarse, EzMesure développés à l’INIST et à ezREEPORT pour la visualisation. \nLes données reportées couvrent les consultations / téléchargements d’articles HTML et PDF effectués à partir des sites éditeur, sur des millésimes courants ou les archives récentes ou anciennes  : \n\n-\tDans les revues abonnées, \n-\tPlus largement dans les titres ouverts sur les sites éditeurs , qu’ils s’agissent de tests, d’open access, d’offres promotionnelles.\n\nElles pourront donc être légèrement différentes des statistiques fournies par les éditeurs et rapportées aux titres abonnés qui sont utilisées dans la constitution des Tableaux de Bord Annuels, que nous vous fournissons une fois l’an, sur les données de l’année n-1.\nDes campagnes de certification, annuelles, sont menées pour veiller à la cohérence entre les données issues des relevés des éditeurs et celles produites par EzPaarse. \n\nAvec ce rapport, nous avons souhaité privilégier la fraîcheur de l’information et vous permettre de suivre de façon plus régulière l’usage des ressources accessibles sur BibCNRS.\n', type: 'md', slots: [0, 1, 2, 3], params: {}, filters: [],
        }],
      }, {
        figures: [{
          type: 'metric', slots: [0, 1, 2, 3], params: { labels: [{ text: 'total des accès', format: { type: 'number' } }, { text: 'Unités consultantes', format: { type: 'number' }, aggregation: { type: 'cardinality', field: 'unit' } }, { text: 'Plateformes', format: { type: 'number' }, aggregation: { type: 'cardinality', field: 'platform' } }, { text: 'Période du', format: { type: 'date' }, aggregation: { type: 'min', field: 'datetime' } }, { text: 'au', format: { type: 'date' }, aggregation: { type: 'max', field: 'datetime' } }] }, filters: [],
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
          type: 'table', slots: [1, 3], params: { title: 'ezpaarse : générique les{{ length }} plateformes les plus consultées', columns: [{ header: 'plateforme', metric: false, aggregation: { type: 'terms', field: 'platform_name' } }, { header: 'nombre de consultations', metric: true, styles: { halign: 'right', valign: 'top' } }], total: false }, filters: [],
        }],
      }, {
        figures: [{
          type: 'table',
          slots: [0, 1, 2, 3],
          params: { title: 'bibcnrs-* : {{ length }} titres de publication INSB', columns: [{ header: 'Titre de revues', metric: false, aggregation: { type: 'terms', field: 'publication_title', size: 14 } }, { header: 'Plateforme', metric: false, aggregation: { type: 'terms', field: 'platform_name', size: 1 } }, { header: 'Editeur', metric: false, aggregation: { type: 'terms', field: 'publisher_name', size: 1 } }, { header: 'nombre de consultations', metric: true, styles: { halign: 'right', valign: 'top' } }], total: false },
          filters: [{
            name: 'portal is bibcnrs-insb', field: 'portal', isNot: false, value: 'bibcnrs-insb',
          }],
        }],
      }, {
        figures: [{
          type: 'table',
          slots: [0, 1, 2, 3],
          params: { title: 'bibcnrs-* : {{ length }} titres de publication INEE', columns: [{ header: 'Titre de revues', metric: false, aggregation: { type: 'terms', field: 'publication_title', size: 14 } }, { header: 'Plateforme', metric: false, aggregation: { type: 'terms', field: 'platform_name', size: 1 } }, { header: 'Editeur', metric: false, aggregation: { type: 'terms', field: 'publisher_name', size: 1 } }, { header: 'nombre de consultations', metric: true, styles: { halign: 'right', valign: 'top' } }], total: false },
          filters: [{
            name: 'portal is bibcnrs-inee', field: 'portal', isNot: false, value: 'bibcnrs-inee',
          }],
        }],
      }, {
        figures: [{
          type: 'table',
          slots: [0, 1, 2, 3],
          params: { title: 'bibcnrs-* : {{ length }} titres de publication INSHS', columns: [{ header: 'Titre de revues', metric: false, aggregation: { type: 'terms', field: 'publication_title', size: 14 } }, { header: 'Plateforme', metric: false, aggregation: { type: 'terms', field: 'platform_name', size: 1 } }, { header: 'Editeur', metric: false, aggregation: { type: 'terms', field: 'publisher_name', size: 1 } }, { header: 'nombre de consultations', metric: true, styles: { halign: 'right', valign: 'top' } }], total: false },
          filters: [{
            name: 'portal is bibcnrs-inshs', field: 'portal', isNot: false, value: 'bibcnrs-inshs',
          }],
        }],
      }, {
        figures: [{
          type: 'table',
          slots: [0, 1, 2, 3],
          params: { title: 'bibcnrs-* : {{ length }} titres de publication INSU', columns: [{ header: 'Titre de revues', metric: false, aggregation: { type: 'terms', field: 'publication_title', size: 14 } }, { header: 'Plateforme', metric: false, aggregation: { type: 'terms', field: 'platform_name', size: 1 } }, { header: 'Editeur', metric: false, aggregation: { type: 'terms', field: 'publisher_name', size: 1 } }, { header: 'nombre de consultations', metric: true, styles: { halign: 'right', valign: 'top' } }], total: false },
          filters: [{
            name: 'portal is bibcnrs-insu', field: 'portal', isNot: false, value: 'bibcnrs-insu',
          }],
        }],
      }, {
        figures: [{
          type: 'table',
          slots: [0, 1, 2, 3],
          params: { title: 'bibcnrs-* : {{ length }} titres de publication INP', columns: [{ header: 'Titre de revues', metric: false, aggregation: { type: 'terms', field: 'publication_title', size: 14 } }, { header: 'Plateforme', metric: false, aggregation: { type: 'terms', field: 'platform_name', size: 1 } }, { header: 'Editeur', metric: false, aggregation: { type: 'terms', field: 'publisher_name', size: 1 } }, { header: 'nombre de consultations', metric: true, styles: { halign: 'right', valign: 'top' } }], total: false },
          filters: [{
            name: 'portal is bibcnrs-inp', field: 'portal', isNot: false, value: 'bibcnrs-inp',
          }],
        }],
      }, {
        figures: [{
          type: 'table',
          slots: [0, 1, 2, 3],
          params: { title: 'bibcnrs-* : {{ length }} titres de publication INC', columns: [{ header: 'Titre de revues', metric: false, aggregation: { type: 'terms', field: 'publication_title', size: 14 } }, { header: 'Plateforme', metric: false, aggregation: { type: 'terms', field: 'platform_name', size: 1 } }, { header: 'Editeur', metric: false, aggregation: { type: 'terms', field: 'publisher_name', size: 1 } }, { header: 'nombre de consultations', metric: true, styles: { halign: 'right', valign: 'top' } }], total: false },
          filters: [{
            name: 'portal is bibcnrs-inc', field: 'portal', isNot: false, value: 'bibcnrs-inc',
          }],
        }],
      }, {
        figures: [{
          type: 'table',
          slots: [0, 1, 2, 3],
          params: { title: 'bibcnrs-* : {{ length }} titres de publication INSMI', columns: [{ header: 'Titre de revues', metric: false, aggregation: { type: 'terms', field: 'publication_title', size: 14 } }, { header: 'Plateforme', metric: false, aggregation: { type: 'terms', field: 'platform_name', size: 1 } }, { header: 'Editeur', metric: false, aggregation: { type: 'terms', field: 'publisher_name', size: 1 } }, { header: 'nombre de consultations', metric: true, styles: { halign: 'right', valign: 'top' } }], total: false },
          filters: [{
            name: 'portal is bibcnrs-insmi', field: 'portal', isNot: false, value: 'bibcnrs-insmi',
          }],
        }],
      }, {
        figures: [{
          type: 'table',
          slots: [0, 1, 2, 3],
          params: { title: 'bibcnrs-* : {{ length }} titres de publication INS2I', columns: [{ header: 'Titre de revues', metric: false, aggregation: { type: 'terms', field: 'publication_title', size: 14 } }, { header: 'Plateforme', metric: false, aggregation: { type: 'terms', field: 'platform_name', size: 1 } }, { header: 'Editeur', metric: false, aggregation: { type: 'terms', field: 'publisher_name', size: 1 } }, { header: 'nombre de consultations', metric: true, styles: { halign: 'right', valign: 'top' } }], total: false },
          filters: [{
            name: 'portal is bibcnrs-ins2i', field: 'portal', isNot: false, value: 'bibcnrs-ins2i',
          }],
        }],
      }, {
        figures: [{
          type: 'table',
          slots: [0, 1, 2, 3],
          params: { title: 'bibcnrs-* : {{ length }} titres de publication INSIS', columns: [{ header: 'Titre de revues', metric: false, aggregation: { type: 'terms', field: 'publication_title', size: 14 } }, { header: 'Plateforme', metric: false, aggregation: { type: 'terms', field: 'platform_name', size: 1 } }, { header: 'Editeur', metric: false, aggregation: { type: 'terms', field: 'publisher_name', size: 1 } }, { header: 'nombre de consultations', metric: true, styles: { halign: 'right', valign: 'top' } }], total: false },
          filters: [{
            name: 'portal is bibcnrs-insis', field: 'portal', isNot: false, value: 'bibcnrs-insis',
          }],
        }],
      }, {
        figures: [{
          type: 'table',
          slots: [0, 1, 2, 3],
          params: { title: 'bibcnrs-* : {{ length }} titres de publication IN2P3', columns: [{ header: 'Titre de revues', metric: false, aggregation: { type: 'terms', field: 'publication_title', size: 14 } }, { header: 'Plateforme', metric: false, aggregation: { type: 'terms', field: 'platform_name', size: 1 } }, { header: 'Editeur', metric: false, aggregation: { type: 'terms', field: 'publisher_name', size: 1 } }, { header: 'nombre de consultations', metric: true, styles: { halign: 'right', valign: 'top' } }], total: false },
          filters: [{
            name: 'portal is bibcnrs-in2p3', field: 'portal', isNot: false, value: 'bibcnrs-in2p3',
          }],
        }],
      }],
    },
    createdAt: parseISO('2024-07-15T12:45:45.484Z'),
    updatedAt: parseISO('2025-01-10T10:06:56.102Z'),
  },
  period: {
    start: parseISO('2024-01-01T00:00:00.000Z'),
    end: parseISO('2024-12-31T23:59:59.999Z'),
  },
  origin: 'tests',
  targets: ['tom.sublet@inist.fr'],
  writeActivity: false,
  printDebug: false,
};

export default data;
