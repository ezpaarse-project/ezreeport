import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TaskGenerationForm from './GenerationForm.vue';

const meta: Meta<typeof TaskGenerationForm> = {
  title: 'Task/Generation Form',
  component: TaskGenerationForm,
};

export default meta;

type Story = StoryObj<typeof TaskGenerationForm>;

export const Daily: Story = {
  render: (args) => ({
    components: { TaskGenerationForm },
    setup() {
      return { args };
    },
    template: '<TaskGenerationForm v-bind="args" />',
  }),
  args: {
    modelValue: {
      id: 'dc1481b1-ff90-4374-a5a9-e3ef4d7cc0fb',
      name: 'Métriques API',
      description: '',
      targets: ['ezteam@couperin.org'],
      recurrence: 'DAILY',
      recurrenceOffset: {},
      nextRun: new Date('2024-12-04T06:00:00.240Z'),
      lastRun: new Date('2024-12-03T06:00:00.240Z'),
      enabled: true,
      createdAt: new Date('2024-06-26T14:49:50.401Z'),
      updatedAt: new Date('2024-12-03T06:00:02.901Z'),
      extends: {
        tags: [{ id: '0', name: 'Administration', color: '#D3339A' }],
      },
      extendedId: 'a538ba09-5c2d-479a-b6f9-0dff77863002',
      namespaceId: 'clxvxybz801d84qdpy1ekrjwn',
    },
  },
};

export const Weekly: Story = {
  render: (args) => ({
    components: { TaskGenerationForm },
    setup() {
      return { args };
    },
    template: '<TaskGenerationForm v-bind="args" />',
  }),
  args: {
    modelValue: {
      id: 'c3ea8fde-c730-4a12-a1f9-3d645640df32',
      name: 'istex hebdo',
      description: '',
      targets: ['ezteam@couperin.org'],
      recurrence: 'WEEKLY',
      recurrenceOffset: {},
      nextRun: new Date('2024-10-14T05:00:13.231Z'),
      lastRun: new Date('2024-10-07T05:00:13.231Z'),
      enabled: false,
      createdAt: new Date('2024-07-12T12:26:19.302Z'),
      updatedAt: new Date('2024-12-04T08:46:26.538Z'),
      extendedId: 'a538ba09-5c2d-479a-b6f9-0dff77863002',
      namespaceId: 'clxvxybz801d84qdpy1ekrjwn',
    },
  },
};

export const Monthly: Story = {
  render: (args) => ({
    components: { TaskGenerationForm },
    setup() {
      return { args };
    },
    template: '<TaskGenerationForm v-bind="args" />',
  }),
  args: {
    modelValue: {
      id: '443b2219-3d92-4124-832d-8f3865fdd012',
      name: 'OMEKA mensuel',
      description: '',
      targets: [
        'ezteam@couperin.org',
        'alexandra.petitjean@foo.br',
        'Julien.franck@foo.br',
        'claire.francois@foo.br',
        'paolo.lai@foo.br',
        'nicolas.thouvenin@foo.br',
        'michele.bonthoux@foo.br',
        'camille.gagny@foo.br',
        'cecilia.fabry@foo.br',
        'laurent.schmitt@foo.br',
        'philippe.borgnet@foo.br',
        'titouan.boudart@foo.br',
        'francois.debeaupuis@foo.br',
        'eric.lebourhis@foo.br',
        'lauriane.locatelli@foo.br',
        'louis.maillard@foo.br',
        'edwige.pierot@foo.br',
        'bernard.sampite@foo.br',
        'alain.zasadzinski@foo.br',
        'nathalie.frick@foo.br',
        'laurent.pelletier@foo.br',
      ],
      recurrence: 'MONTHLY',
      recurrenceOffset: {},
      nextRun: new Date('2025-02-01T06:00:45.959Z'),
      lastRun: new Date('2024-12-02T06:00:45.959Z'),
      enabled: true,
      createdAt: new Date('2024-07-12T12:31:25.078Z'),
      updatedAt: new Date('2024-12-04T08:46:38.162Z'),
      extendedId: 'a538ba09-5c2d-479a-b6f9-0dff77863002',
      namespaceId: 'clxvxybz801d84qdpy1ekrjwn',
    },
  },
};

export const Quarterly: Story = {
  render: (args) => ({
    components: { TaskGenerationForm },
    setup() {
      return { args };
    },
    template: '<TaskGenerationForm v-bind="args" />',
  }),
  args: {
    modelValue: {
      id: '1c174863-172b-419e-accd-b3d16d1cbbb3',
      name: 'TR Total_Item_Requests trimestriel',
      description: '',
      namespaceId: '5a01b060-1217-11eb-af77-ff33b5dd411e',
      extendedId: 'bde49b1b-c3c5-4776-96d7-e854b22c3d0f',
      lastExtended: null,
      targets: ['helene@univ-foobar.fr'],
      recurrence: 'QUARTERLY',
      recurrenceOffset: {},
      nextRun: new Date('2025-03-31T23:59:59.000Z'),
      lastRun: undefined,
      enabled: true,
      createdAt: new Date('2025-03-10T09:25:56.703Z'),
      updatedAt: new Date('2025-03-10T09:25:56.703Z'),
    },
  },
};

export const Biennial: Story = {
  render: (args) => ({
    components: { TaskGenerationForm },
    setup() {
      return { args };
    },
    template: '<TaskGenerationForm v-bind="args" />',
  }),
  args: {
    modelValue: {
      id: 'fb1698d8-95f0-4c44-9cc2-d99552f7ffaf',
      name: 'ezpaarse semestriel',
      description: '',
      namespaceId: '5a01b060-1217-11eb-af77-ff33b5dd411e',
      extendedId: 'cf986a26-1b62-478c-9e88-a6d60254d761',
      lastExtended: null,
      targets: ['helene@univ-foobar.fr'],
      recurrence: 'BIENNIAL',
      recurrenceOffset: {},
      nextRun: new Date('2025-06-30T00:00:00.000Z'),
      lastRun: undefined,
      enabled: true,
      createdAt: new Date('2025-03-10T09:25:56.256Z'),
      updatedAt: new Date('2025-03-10T09:25:56.256Z'),
    },
  },
};

export const Yearly: Story = {
  render: (args) => ({
    components: { TaskGenerationForm },
    setup() {
      return { args };
    },
    template: '<TaskGenerationForm v-bind="args" />',
  }),
  args: {
    modelValue: {
      id: '9a0f8b83-ae34-4768-8d08-1646037a9e8d',
      name: 'PR Searches_Platform annuel',
      description: '',
      targets: [
        'ezteam@couperin.org',
        'celine.paillaret@univ-montp3.fr',
        'marie.nikichine@univ-montp3.fr',
      ],
      recurrence: 'YEARLY',
      recurrenceOffset: {},
      nextRun: new Date('2025-02-01T05:00:00.000Z'),
      enabled: true,
      createdAt: new Date('2024-12-02T13:23:48.409Z'),
      updatedAt: new Date('2024-12-02T14:15:25.864Z'),
      extendedId: 'a538ba09-5c2d-479a-b6f9-0dff77863002',
      namespaceId: 'clxvxybz801d84qdpy1ekrjwn',
    },
  },
};
