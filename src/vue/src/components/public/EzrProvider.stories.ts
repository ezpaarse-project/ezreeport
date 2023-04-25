import type { Meta, StoryObj } from '@storybook/vue';
import EzrProvider from './EzrProvider.vue';

const meta: Meta<typeof EzrProvider> = {
  title: 'ezr-provider (EzrProvider)',
  component: EzrProvider,
};

export default meta;

type Story = StoryObj<typeof EzrProvider>;

export const Basic: Story = {
  render: (args) => ({
    components: { EzrProvider },
    props: Object.keys(args),
    template: '<EzrProvider v-bind="$props" v-on="$props" />',
  }),
};
