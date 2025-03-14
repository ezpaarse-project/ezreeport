import type { Meta, StoryObj } from '@storybook/vue3';

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
      nextRun: new Date('2024-12-04T06:00:00.240Z'),
      lastRun: new Date('2024-12-03T06:00:00.240Z'),
      enabled: true,
      createdAt: new Date('2024-06-26T14:49:50.401Z'),
      updatedAt: new Date('2024-12-03T06:00:02.901Z'),
      extends: {
        tags: [{ name: 'Administration', color: '#D3339A' }],
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
      targets: ['ezteam@couperin.org', 'alexandra.petitjean@inist.fr', 'Julien.franck@inist.fr', 'claire.francois@inist.fr', 'paolo.lai@inist.fr', 'nicolas.thouvenin@inist.fr', 'michele.bonthoux@inist.fr', 'camille.gagny@inist.fr', 'cecilia.fabry@inist.fr', 'laurent.schmitt@inist.fr', 'philippe.borgnet@inist.fr', 'titouan.boudart@inist.fr', 'francois.debeaupuis@inist.fr', 'eric.lebourhis@inist.fr', 'lauriane.locatelli@inist.fr', 'louis.maillard@inist.fr', 'edwige.pierot@inist.fr', 'bernard.sampite@inist.fr', 'alain.zasadzinski@inist.fr', 'nathalie.frick@inist.fr', 'laurent.pelletier@inist.fr'],
      recurrence: 'MONTHLY',
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
      targets: ['ezteam@couperin.org', 'celine.paillaret@univ-montp3.fr', 'marie.nikichine@univ-montp3.fr'],
      recurrence: 'YEARLY',
      nextRun: new Date('2025-02-01T05:00:00.000Z'),
      enabled: true,
      createdAt: new Date('2024-12-02T13:23:48.409Z'),
      updatedAt: new Date('2024-12-02T14:15:25.864Z'),
      extendedId: 'a538ba09-5c2d-479a-b6f9-0dff77863002',
      namespaceId: 'clxvxybz801d84qdpy1ekrjwn',
    }
    ,
  },
};
