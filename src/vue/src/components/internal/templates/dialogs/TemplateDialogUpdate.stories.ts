import type { Meta, StoryObj } from '@storybook/vue';
import TemplateDialogUpdate from './TemplateDialogUpdate.vue';

const meta: Meta<typeof TemplateDialogUpdate> = {
  title: 'Templates/Internal/Dialogs/TemplateDialogUpdate',
  component: TemplateDialogUpdate,
  args: {
    value: true,
    name: 'basique',
  },
  argTypes: {
    input: { action: 'input' },
  },
};

export default meta;

type Story = StoryObj<typeof TemplateDialogUpdate>;

export const Basic: Story = {
  render: (args) => ({
    components: { TemplateDialogUpdate },
    props: Object.keys(args),
    template: '<TemplateDialogUpdate v-bind="$props" v-on="$props" />',
  }),
};
