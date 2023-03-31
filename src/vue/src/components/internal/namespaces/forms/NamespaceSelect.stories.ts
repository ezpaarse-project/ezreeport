import type { Meta, StoryObj } from '@storybook/vue';
import NamespaceSelect from './NamespaceSelect.vue';

const meta: Meta<typeof NamespaceSelect> = {
  title: 'Namespaces/Internal/Forms/NamespaceSelect',
  component: NamespaceSelect,
  args: {
    value: '',
    hideAll: false,
    errorMessage: '',
  },
  argTypes: {
    input: { action: 'input' },
  },
};

export default meta;

type Story = StoryObj<typeof NamespaceSelect>;

export const Basic: Story = {
  render: (args) => ({
    components: { NamespaceSelect },
    props: Object.keys(args),
    template: '<NamespaceSelect v-bind="$props" v-on="$props" />',
  }),
};
