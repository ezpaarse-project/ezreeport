import type { Meta, StoryObj } from '@storybook/vue';
import TemplateList from './TemplateList.vue';

const meta: Meta<typeof TemplateList> = {
  title: 'Templates/TemplateList',
  component: TemplateList,
};

export default meta;

type Story = StoryObj<typeof TemplateList>;

export const Basic: Story = {
  render: (args) => ({
    components: { TemplateList },
    props: Object.keys(args),
    template: '<TemplateList v-bind="$props" v-on="$props" />',
  }),
};
