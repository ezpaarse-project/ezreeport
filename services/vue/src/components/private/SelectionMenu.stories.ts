import type { Meta, StoryObj } from '@storybook/vue3-vite';

import SelectionMenu from './SelectionMenu.vue';

const meta: Meta<typeof SelectionMenu> = {
  component: SelectionMenu,
  title: 'Utils/Selection Menu',
};

export default meta;

type Story = StoryObj<typeof SelectionMenu>;

export const Default: Story = {
  args: {
    modelValue: ['a', 'b', 'c'],
    text: 'My Selection',
  },
  render: (args: unknown) => ({
    components: { SelectionMenu },
    setup() {
      return { args };
    },
    template: '<SelectionMenu v-bind="args" />',
  }),
};
