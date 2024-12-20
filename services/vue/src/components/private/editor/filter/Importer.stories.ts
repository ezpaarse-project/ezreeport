import type { Meta, StoryObj } from '@storybook/vue3';

import EditorFilterImporter from './Importer.vue';

const meta: Meta<typeof EditorFilterImporter> = {
  title: 'Template Editor/Filters/Importer',
  component: EditorFilterImporter,
};

export default meta;

type Story = StoryObj<typeof EditorFilterImporter>;

export const Basic: Story = {
  render: (args) => ({
    components: { EditorFilterImporter },
    setup() {
      return { args };
    },
    template: '<EditorFilterImporter v-bind="args" />',
  }),
};
