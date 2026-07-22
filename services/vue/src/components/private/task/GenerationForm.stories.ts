import type { Meta, StoryObj } from '@storybook/vue3-vite';

import TaskGenerationForm from './GenerationForm.vue';

const meta: Meta<typeof TaskGenerationForm> = {
  component: TaskGenerationForm,
  title: 'Task/Generation Form',
};

export default meta;

type Story = StoryObj<typeof TaskGenerationForm>;

export const Daily: Story = {
  args: {
    modelValue: {
      createdAt: new Date('2024-06-26T14:49:50.401Z'),
      description: '',
      enabled: true,
      extendedId: 'a538ba09-5c2d-479a-b6f9-0dff77863002',
      extends: {
        tags: [{ color: '#D3339A', id: '0', name: 'Administration' }],
      },
      id: 'dc1481b1-ff90-4374-a5a9-e3ef4d7cc0fb',
      lastRun: new Date('2024-12-03T06:00:00.240Z'),
      name: 'Métriques API',
      namespaceId: 'clxvxybz801d84qdpy1ekrjwn',
      nextRun: new Date('2024-12-04T06:00:00.240Z'),
      recurrence: 'DAILY',
      recurrenceOffset: {},
      targets: ['ezteam@couperin.org'],
      updatedAt: new Date('2024-12-03T06:00:02.901Z'),
    },
  },
  render: (args: unknown) => ({
    components: { TaskGenerationForm },
    setup() {
      return { args };
    },
    template: '<TaskGenerationForm v-bind="args" />',
  }),
};

export const Weekly: Story = {
  args: {
    modelValue: {
      createdAt: new Date('2024-07-12T12:26:19.302Z'),
      description: '',
      enabled: false,
      extendedId: 'a538ba09-5c2d-479a-b6f9-0dff77863002',
      id: 'c3ea8fde-c730-4a12-a1f9-3d645640df32',
      lastRun: new Date('2024-10-07T05:00:13.231Z'),
      name: 'istex hebdo',
      namespaceId: 'clxvxybz801d84qdpy1ekrjwn',
      nextRun: new Date('2024-10-14T05:00:13.231Z'),
      recurrence: 'WEEKLY',
      recurrenceOffset: {},
      targets: ['ezteam@couperin.org'],
      updatedAt: new Date('2024-12-04T08:46:26.538Z'),
    },
  },
  render: (args: unknown) => ({
    components: { TaskGenerationForm },
    setup() {
      return { args };
    },
    template: '<TaskGenerationForm v-bind="args" />',
  }),
};

export const Monthly: Story = {
  args: {
    modelValue: {
      createdAt: new Date('2024-07-12T12:31:25.078Z'),
      description: '',
      enabled: true,
      extendedId: 'a538ba09-5c2d-479a-b6f9-0dff77863002',
      id: '443b2219-3d92-4124-832d-8f3865fdd012',
      lastRun: new Date('2024-12-02T06:00:45.959Z'),
      name: 'OMEKA mensuel',
      namespaceId: 'clxvxybz801d84qdpy1ekrjwn',
      nextRun: new Date('2025-02-01T06:00:45.959Z'),
      recurrence: 'MONTHLY',
      recurrenceOffset: {},
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
      updatedAt: new Date('2024-12-04T08:46:38.162Z'),
    },
  },
  render: (args: unknown) => ({
    components: { TaskGenerationForm },
    setup() {
      return { args };
    },
    template: '<TaskGenerationForm v-bind="args" />',
  }),
};

export const Quarterly: Story = {
  args: {
    modelValue: {
      createdAt: new Date('2025-03-10T09:25:56.703Z'),
      description: '',
      enabled: true,
      extendedId: 'bde49b1b-c3c5-4776-96d7-e854b22c3d0f',
      id: '1c174863-172b-419e-accd-b3d16d1cbbb3',
      lastExtended: null,
      lastRun: undefined,
      name: 'TR Total_Item_Requests trimestriel',
      namespaceId: '5a01b060-1217-11eb-af77-ff33b5dd411e',
      nextRun: new Date('2025-03-31T23:59:59.000Z'),
      recurrence: 'QUARTERLY',
      recurrenceOffset: {},
      targets: ['helene@univ-foobar.fr'],
      updatedAt: new Date('2025-03-10T09:25:56.703Z'),
    },
  },
  render: (args: unknown) => ({
    components: { TaskGenerationForm },
    setup() {
      return { args };
    },
    template: '<TaskGenerationForm v-bind="args" />',
  }),
};

export const Biennial: Story = {
  args: {
    modelValue: {
      createdAt: new Date('2025-03-10T09:25:56.256Z'),
      description: '',
      enabled: true,
      extendedId: 'cf986a26-1b62-478c-9e88-a6d60254d761',
      id: 'fb1698d8-95f0-4c44-9cc2-d99552f7ffaf',
      lastExtended: null,
      lastRun: undefined,
      name: 'ezpaarse semestriel',
      namespaceId: '5a01b060-1217-11eb-af77-ff33b5dd411e',
      nextRun: new Date('2025-06-30T00:00:00.000Z'),
      recurrence: 'BIENNIAL',
      recurrenceOffset: {},
      targets: ['helene@univ-foobar.fr'],
      updatedAt: new Date('2025-03-10T09:25:56.256Z'),
    },
  },
  render: (args: unknown) => ({
    components: { TaskGenerationForm },
    setup() {
      return { args };
    },
    template: '<TaskGenerationForm v-bind="args" />',
  }),
};

export const Yearly: Story = {
  args: {
    modelValue: {
      createdAt: new Date('2024-12-02T13:23:48.409Z'),
      description: '',
      enabled: true,
      extendedId: 'a538ba09-5c2d-479a-b6f9-0dff77863002',
      id: '9a0f8b83-ae34-4768-8d08-1646037a9e8d',
      name: 'PR Searches_Platform annuel',
      namespaceId: 'clxvxybz801d84qdpy1ekrjwn',
      nextRun: new Date('2025-02-01T05:00:00.000Z'),
      recurrence: 'YEARLY',
      recurrenceOffset: {},
      targets: [
        'ezteam@couperin.org',
        'celine.paillaret@univ-montp3.fr',
        'marie.nikichine@univ-montp3.fr',
      ],
      updatedAt: new Date('2024-12-02T14:15:25.864Z'),
    },
  },
  render: (args: unknown) => ({
    components: { TaskGenerationForm },
    setup() {
      return { args };
    },
    template: '<TaskGenerationForm v-bind="args" />',
  }),
};
