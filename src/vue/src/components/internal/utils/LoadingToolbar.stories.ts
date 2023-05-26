import type { Meta, StoryObj } from '@storybook/vue';
import LoadingToolbar from './LoadingToolbar.vue';

const meta: Meta<typeof LoadingToolbar> = {

  component: LoadingToolbar,
  args: {
    text: 'My component',
    loading: false,
    elevation: 0,
  },
};

export default meta;

type Story = StoryObj<typeof LoadingToolbar>;

export const Basic: Story = {
  render: (args) => ({
    components: { LoadingToolbar },
    props: Object.keys(args),
    template: '<LoadingToolbar v-bind="$props" v-on="$props" />',
  }),
};

export const CustomContent: Story = {
  render: (args) => ({
    components: { LoadingToolbar },
    props: Object.keys(args),
    template: `<LoadingToolbar v-bind="$props" v-on="$props">
  <div v-html="customContent"></div>
</LoadingToolbar>`,
  }),
  args: {
    customContent: "I'm <i>custom</i> content",
  },
};
