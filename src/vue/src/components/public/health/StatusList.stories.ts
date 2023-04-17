import type { Meta, StoryObj } from '@storybook/vue';
import StatusList from './StatusList.vue';

const meta: Meta<typeof StatusList> = {
  title: 'ezr-status-list (StatusList)',
  component: StatusList,
};

export default meta;

type Story = StoryObj<typeof StatusList>;

export const Basic: Story = {
  render: (args) => ({
    components: { StatusList },
    props: Object.keys(args),
    template: '<StatusList v-bind="$props" v-on="$props" />',
  }),
};
