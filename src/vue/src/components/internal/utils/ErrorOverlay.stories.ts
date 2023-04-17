import type { Meta, StoryObj } from '@storybook/vue';
import ErrorOverlay from './ErrorOverlay.vue';

const meta: Meta<typeof ErrorOverlay> = {

  component: ErrorOverlay,
  args: {
    value: 'A mock error occurred',
  },
  argTypes: {
    input: { action: 'input' },
  },
};

export default meta;

type Story = StoryObj<typeof ErrorOverlay>;

export const Basic: Story = {
  render: (args) => ({
    components: { ErrorOverlay },
    props: Object.keys(args),
    template: `<div style="position: relative; height: 5rem;">
  <ErrorOverlay v-bind="$props" v-on="$props" />
</div>`,
  }),
};
