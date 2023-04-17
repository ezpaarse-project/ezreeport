import type { Meta, StoryObj } from '@storybook/vue';
import TemplateDialogCreate from './TemplateDialogCreate.vue';

const meta: Meta<typeof TemplateDialogCreate> = {

  component: TemplateDialogCreate,
  args: {
    value: true,
  },
  argTypes: {
    input: { action: 'input' },
  },
};

export default meta;

type Story = StoryObj<typeof TemplateDialogCreate>;

export const Basic: Story = {
  render: (args) => ({
    components: { TemplateDialogCreate },
    props: Object.keys(args),
    template: '<TemplateDialogCreate v-bind="$props" v-on="$props" />',
  }),
};
