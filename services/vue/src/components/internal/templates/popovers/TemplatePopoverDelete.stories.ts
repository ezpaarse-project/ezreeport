import type { Meta, StoryObj } from '@storybook/vue';
import templates from '~/mock/templates';
import TemplatePopoverDelete from './TemplatePopoverDelete.vue';

const meta: Meta<typeof TemplatePopoverDelete> = {

  component: TemplatePopoverDelete,
  args: {
    template: templates[0],
    value: true,
    coords: {
      x: 0,
      y: 0,
    },
  },
  argTypes: {
    input: { action: 'input' },
    deleted: { action: 'deleted' },
  },
};

export default meta;

type Story = StoryObj<typeof TemplatePopoverDelete>;

export const Basic: Story = {
  render: (args) => ({
    components: { TemplatePopoverDelete },
    props: Object.keys(args),
    template: '<TemplatePopoverDelete v-bind="$props" v-on="$props" />',
  }),
};
