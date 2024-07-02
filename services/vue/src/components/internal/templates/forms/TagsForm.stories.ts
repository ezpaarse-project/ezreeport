import type { Meta, StoryObj } from '@storybook/vue';
import TagsForm, { type Tag } from './TagsForm.vue';

const meta: Meta<typeof TagsForm> = {

  component: TagsForm,
  args: {
    value: [
      { name: 'Tag1', color: 'red' },
      { name: 'Tag2', color: '#00f' },
    ] satisfies Tag[],
    availableTags: [
      { name: 'AutoTag1' },
    ] satisfies Tag[],
  },
  argTypes: {
    input: { action: 'input' },
  },
};

export default meta;

type Story = StoryObj<typeof TagsForm>;

export const Basic: Story = {
  render: (args) => ({
    components: { TagsForm },
    props: Object.keys(args),
    template: '<TagsForm v-bind="$props" v-on="$props" />',
  }),
};
