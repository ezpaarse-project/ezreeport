import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import SelectionMenu from './SelectionMenu.vue';

const meta: Meta<typeof SelectionMenu> = {
  component: SelectionMenu,
  title: 'Utils/Selection Menu',
};

const { defineStory } = useStory(meta);

export default meta;

export const Default = defineStory({
  modelValue: ['a', 'b', 'c'],
  text: 'My Selection',
});
