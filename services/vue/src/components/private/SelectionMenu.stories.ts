import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SelectionMenu from './SelectionMenu.vue';

const meta: Meta<typeof SelectionMenu> = {
  title: 'Utils/Selection Menu',
  component: SelectionMenu,
};

export default meta;

type Story = StoryObj<typeof SelectionMenu>;

export const Default: Story = {
  render: (args) => ({
    components: { SelectionMenu },
    setup() {
      return { args };
    },
    template: '<SelectionMenu v-bind="args" />',
  }),
  args: {
    modelValue: ['a', 'b', 'c'],
    text: 'My Selection',
  },
};
