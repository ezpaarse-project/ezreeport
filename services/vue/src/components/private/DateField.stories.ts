import type { Meta, StoryObj } from '@storybook/vue3-vite';

import DateField from './DateField.vue';

const meta: Meta<typeof DateField> = {
  title: 'Utils/Date Field',
  component: DateField,
};

export default meta;

type Story = StoryObj<typeof DateField>;

export const Default: Story = {
  render: (args) => ({
    components: { DateField },
    setup() {
      return { args };
    },
    template: '<DateField v-bind="args" />',
  }),
  args: {
    modelValue: new Date(),
  },
};
