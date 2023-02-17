import type { Meta, StoryObj } from '@storybook/vue';
import ObjectTree from './ObjectTree.vue';

const meta: Meta<typeof ObjectTree> = {
  title: 'Utils (Internal)/ObjectTree/ObjectTree',
  component: ObjectTree,
  args: {
    label: 'Test Tree',
    value: {
      type: 'complex object',
      with: {
        simple: false,
        nested: {
          'pro-perties': [
            'item-1',
            'item-2',
            'item-3',
          ],
          count: 3,
        },
      },
      fnc: () => 0,
      symb: Symbol('test'),
      un: undefined,
    },
  },
};

export default meta;

type Story = StoryObj<typeof ObjectTree>;

export const Readonly: Story = {
  render: (args) => ({
    components: { ObjectTree },
    props: Object.keys(args),
    template: '<ObjectTree v-bind="$props" v-on="$props" />',
  }),
};

export const Editable: Story = {
  argTypes: {
    input: { action: 'input' },
  },
  render: (args) => ({
    components: { ObjectTree },
    props: Object.keys(args),
    template: '<ObjectTree v-bind="$props" v-on="$props" />',
  }),
};
