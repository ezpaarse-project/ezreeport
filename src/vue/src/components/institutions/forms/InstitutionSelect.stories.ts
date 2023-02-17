import type { Meta, StoryObj } from '@storybook/vue';
import InstitutionSelect from './InstitutionSelect.vue';

const meta: Meta<typeof InstitutionSelect> = {
  title: 'Institutions/Internal/Forms/InstitutionSelect',
  component: InstitutionSelect,
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

type Story = StoryObj<typeof InstitutionSelect>;

export const Basic: Story = {
  render: (args) => ({
    components: { InstitutionSelect },
    props: Object.keys(args),
    template: '<InstitutionSelect v-bind="$props" v-on="$props" />',
  }),
};
