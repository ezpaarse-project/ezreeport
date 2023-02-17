import type { Meta, StoryObj } from '@storybook/vue';
import RichListItem from './RichListItem.vue';

const meta: Meta<typeof RichListItem> = {
  title: 'Utils (Internal)/RichListItem',
  component: RichListItem,
  args: {
    title: 'Name',
    subtitle: 'subtitle',
    capitalizeSubtitle: false,
    src: '',
    alt: '',
    fallbackIcon: 'mdi-image-off',
    avatarColor: '#808080',
  },
  argTypes: {
    avatarColor: { control: { type: 'color' } },
  },
};

export default meta;

type Story = StoryObj<typeof RichListItem>;

export const Basic: Story = {
  render: (args) => ({
    components: { RichListItem },
    props: Object.keys(args),
    template: '<RichListItem v-bind="$props" v-on="$props" />',
  }),
};
