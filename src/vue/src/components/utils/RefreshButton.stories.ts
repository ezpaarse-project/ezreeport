import type { Meta, StoryObj } from '@storybook/vue';
import RefreshButton from './RefreshButton.vue';

const meta: Meta<typeof RefreshButton> = {
  title: 'Utils (Internal)/RefreshButton',
  component: RefreshButton,
  args: {
    loading: false,
    disabled: false,
    tooltip: 'Tooltip',
  },
  argTypes: {
    click: { action: 'click' },
  },
};

export default meta;

type Story = StoryObj<typeof RefreshButton>;

export const Basic: Story = {
  render: (args) => ({
    components: { RefreshButton },
    props: Object.keys(args),
    template: '<RefreshButton v-bind="$props" v-on="$props" />',
  }),
};
