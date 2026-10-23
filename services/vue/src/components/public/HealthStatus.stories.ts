import type { Meta } from '@storybook/vue3-vite';

import { useStory } from '~/__mocks__/utils';

import HealthStatus from './HealthStatus.vue';

const meta: Meta<typeof HealthStatus> = {
  component: HealthStatus,
  title: 'Public/Health Status',
};

const { defineStory } = useStory(meta);

export default meta;

export const Default = defineStory({});
