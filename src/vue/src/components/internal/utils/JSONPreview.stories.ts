import type { Meta, StoryObj } from '@storybook/vue';
import CodeBlock from './JSONPreview.vue';

const meta: Meta<typeof CodeBlock> = {

  component: CodeBlock,
  args: {
    value: { hey: 'you', im: [{ complex: 'yeah' }, { reactive: true }], order: 66 },
  },
};

export default meta;

type Story = StoryObj<typeof CodeBlock>;

export const Basic: Story = {
  render: (args) => ({
    components: { CodeBlock },
    props: Object.keys(args),
    template: '<CodeBlock v-bind="$props" v-on="$props" />',
  }),
};
