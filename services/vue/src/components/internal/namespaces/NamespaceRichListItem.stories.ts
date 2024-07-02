import type { Meta, StoryObj } from '@storybook/vue';
import NamespaceRichListItem from './NamespaceRichListItem.vue';

const meta: Meta<typeof NamespaceRichListItem> = {

  component: NamespaceRichListItem,
  args: {
    namespace: {
      id: 'c141ab04-d3e2-4f12-b8fc-5c8f4311311f',
      name: 'bibcnrs',
      logoId: null,
      createdAt: new Date(Date.parse('2023-03-24T13:23:04.688Z')),
      updatedAt: new Date(Date.parse('2023-03-24T13:23:04.688Z')),
    },
  },
};

export default meta;

type Story = StoryObj<typeof NamespaceRichListItem>;

export const Basic: Story = {
  render: (args) => ({
    components: { NamespaceRichListItem },
    props: Object.keys(args),
    template: '<NamespaceRichListItem v-bind="$props" v-on="$props" />',
  }),
};
