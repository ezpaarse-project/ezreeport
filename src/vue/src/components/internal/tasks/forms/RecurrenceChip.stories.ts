import type { Meta, StoryObj } from '@storybook/vue';
import { tasks } from '@ezpaarse-project/ezreeport-sdk-js';
import RecurrenceChip from './RecurrenceChip.vue';

const recurrences = [
  tasks.Recurrence.DAILY,
  tasks.Recurrence.WEEKLY,
  tasks.Recurrence.MONTHLY,
  tasks.Recurrence.QUARTERLY,
  tasks.Recurrence.BIENNIAL,
  tasks.Recurrence.YEARLY,
];

const sizes = [
  'x-small',
  'small',
  'normal',
  'large',
  'x-large',
];

const meta: Meta<typeof RecurrenceChip> = {

  component: RecurrenceChip,
  args: {
    value: recurrences[0],
    size: 'normal',
    selectable: false,
    classes: '',
    on: {},
  },
  argTypes: {
    value: { options: recurrences },
    size: { options: sizes },
    input: { action: 'input' },
  },
};

export default meta;

type Story = StoryObj<typeof RecurrenceChip>;

export const Basic: Story = {
  render: (args) => ({
    components: { RecurrenceChip },
    props: Object.keys(args),
    template: '<RecurrenceChip v-bind="$props" v-on="$props" />',
  }),
};
