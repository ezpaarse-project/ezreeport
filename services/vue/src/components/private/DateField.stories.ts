import type { Meta, StoryObj } from '@storybook/vue3-vite';

import DateField from './DateField.vue';

const meta: Meta<typeof DateField> = {
  component: DateField,
  title: 'Utils/Date Field',
};

export default meta;

type Story = StoryObj<typeof DateField>;

export const Default: Story = {
  args: {
    modelValue: new Date(),
  },
  render: (args: unknown) => ({
    components: { DateField },
    setup() {
      return { args };
    },
    template: '<DateField v-bind="args" />',
  }),
};
