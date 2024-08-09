import type { Meta, StoryObj } from '@storybook/vue';

import ElasticIndexSelector from './ElasticIndexSelector.vue';

const meta: Meta<typeof ElasticIndexSelector> = {

  component: ElasticIndexSelector,
  args: {
    value: '',
    label: 'Elastic Index',
    rules: [],
    prependIcon: 'mdi-database',
    dense: true,
    disabled: false,
  },
  argTypes: {
    input: { action: 'input' },
  },
};

export default meta;

type Story = StoryObj<typeof ElasticIndexSelector>;

export const Basic: Story = {
  render: ({ items, ...args }) => ({
    components: { ElasticIndexSelector },
    props: Object.keys(args),
    template: `<div style="position: relative; height: 5rem;">
  <ElasticIndexSelector v-bind="$props" v-on="$props" />
</div>`,
  }),
};
