import type { Meta, StoryObj } from '@storybook/vue';
import TemplateDialogRead from './TemplateDialogRead.vue';

const meta: Meta<typeof TemplateDialogRead> = {

  component: TemplateDialogRead,
  args: {
    value: true,
    name: 'scratch',
  },
  argTypes: {
    input: { action: 'input' },
  },
};

export default meta;

type Story = StoryObj<typeof TemplateDialogRead>;

export const Basic: Story = {
  render: (args) => ({
    components: { TemplateDialogRead },
    props: Object.keys(args),
    template: '<TemplateDialogRead v-bind="$props" v-on="$props" />',
  }),
};
