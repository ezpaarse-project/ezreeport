import type { Meta, StoryObj } from '@storybook/vue';
import CronList from './CronList.vue';

const meta: Meta<typeof CronList> = {
  title: 'Crons/CronList',
  component: CronList,
};

export default meta;

type Story = StoryObj<typeof CronList>;

export const Basic: Story = {
  render: (args) => ({
    components: { CronList },
    props: Object.keys(args),
    template: '<ezr-cron-list v-bind="$props" v-on="$props" />',
  }),
};
