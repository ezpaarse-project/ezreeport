import type { Meta, StoryObj } from '@storybook/vue';
import ToggleableObjectTree from './ToggleableObjectTree.vue';

const meta: Meta<typeof ToggleableObjectTree> = {

  component: ToggleableObjectTree,
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

type Story = StoryObj<typeof ToggleableObjectTree>;

export const Readonly: Story = {
  render: (args) => ({
    components: { ToggleableObjectTree },
    props: Object.keys(args),
    template: '<ToggleableObjectTree v-bind="$props" v-on="$props" />',
  }),
};

export const Editable: Story = {
  argTypes: {
    input: { action: 'input' },
  },
  render: (args) => ({
    components: { ToggleableObjectTree },
    props: Object.keys(args),
    template: '<ToggleableObjectTree v-bind="$props" v-on="$props" />',
  }),
};
