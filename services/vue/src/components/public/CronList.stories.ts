import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import CronList from './CronList.vue';

const meta: Meta<typeof CronList> = {
  component: CronList,
  title: 'Public/Cron List',
};

const { defineStory } = useStory(meta);

export default meta;

export const Default = defineStory({});
