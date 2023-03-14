import type { Meta, StoryObj } from '@storybook/vue';
import CustomSwitch from './CustomSwitch.vue';

const meta: Meta<typeof CustomSwitch> = {
  title: 'Utils (Internal)/CustomSwitch',
  component: CustomSwitch,
  args: {
    expand: false,
    reverse: false,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    label: 'My Switch',
  },
};

export default meta;

type Story = StoryObj<typeof CustomSwitch>;

export const Basic: Story = {
  render: (args) => ({
    components: { CustomSwitch },
    props: Object.keys(args),
    template: '<CustomSwitch v-bind="$props" v-on="$props" />',
  }),
};
