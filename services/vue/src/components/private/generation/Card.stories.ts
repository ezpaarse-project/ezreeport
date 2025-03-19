import type { Meta, StoryObj } from '@storybook/vue3';

import GenerationCard from './Card.vue';

const meta: Meta<typeof GenerationCard> = {
  title: 'Generation/Card',
  component: GenerationCard,
};

export default meta;

type Story = StoryObj<typeof GenerationCard>;

export const Default: Story = {
  render: (args) => ({
    components: { GenerationCard },
    setup() {
      return { args };
    },
    template: '<GenerationCard v-bind="args" />',
  }),
  args: {
    modelValue: {
      id: '45f782d4-735a-4fdf-a50d-09425ba0d1b1',
      taskId: 'ca65ea81-d855-4169-99f6-6e614e6776ea',
      start: new Date('2023-12-31T23:00:00.000Z'),
      end: new Date('2024-12-31T22:59:59.999Z'),
      targets: [
        'ezteam@couperin.org',
        'isabelle.didelot@foo.br',
        'michele.bonthoux@foo.br',
        'patrice.bellot@bar-dir.fr',
        'Jean-Jacques.BESSOULE@bar.fr',
        'helein@math.univ-paris-diderot.fr',
        'benoit.pier@bar-dir.fr',
        'sylvie.rousset@bar.fr',
        'Laurence.ELKHOURI@bar-dir.fr',
        'cecilia.fabry@foo.br',
        'claire.francois@foo.br',
        'paolo.lai@foo.br',
        'laurent.schmitt@foo.br',
        'nicolas.thouvenin@foo.br',
        'christine.weil-miko@foo.br',
        'mathieu.grives@bar.fr',
        'Laurent.LELLOUCH@bar-dir.fr',
        'astrid.aschehoug@bar.fr',
        'didier.bouchon@bar.fr',
        'nathalie.pothier@bar-orleans.fr',
        'irini.paltani-sargologos@bar.fr',
        'serge.bauin@bar.fr',
        'xavier.launois@foo.br',
        'romane.lesiuk@foo.br',
        'mikael.kepenekian@bar.fr',
        'florent.potier@foo.br',
        'melanie.marcon@foo.br',
      ],
      origin: 'ezmesure-admin',
      writeActivity: false,
      status: 'SUCCESS',
      progress: 100,
      took: 1501,
      reportId: '2025/2025-03/ezREEPORT_bibcnrs-rapport-ddor-annuel',
      createdAt: new Date('2025-03-18T14:06:39.678Z'),
      updatedAt: new Date('2025-03-18T14:06:41.179Z'),
    },
  },
};

export const Failed: Story = {
  render: (args) => ({
    components: { GenerationCard },
    setup() {
      return { args };
    },
    template: '<GenerationCard v-bind="args" />',
  }),
  args: {
    modelValue: {
      id: '720cf67b-8ed2-4527-8815-6e19663c4cdf',
      taskId: '1e1b8d36-1154-4ed5-9335-c95545680962',
      start: new Date('2024-09-30T22:00:00.000Z'),
      end: new Date('2024-12-31T22:59:59.999Z'),
      targets: [
        'ezteam@couperin.org',
      ],
      origin: 'ezmesure-admin',
      writeActivity: false,
      status: 'ERROR',
      progress: 0,
      took: 29,
      reportId: '2025/2025-03/ezREEPORT_dr-tii-générique-trimestriel',
      createdAt: new Date('2025-03-18T14:04:18.807Z'),
      updatedAt: new Date('2025-03-18T14:04:18.836Z'),
    },
  },
};
