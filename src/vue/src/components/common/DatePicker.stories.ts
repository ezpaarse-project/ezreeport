import type { Meta, StoryObj } from '@storybook/vue';
import DatePicker from './DatePicker.vue';

const meta: Meta<typeof DatePicker> = {
  title: 'Utils (Internal)/DatePicker',
  component: DatePicker,
  args: {
    label: 'Story',
    value: new Date(),
    min: new Date(2000, 0, 1),
    max: new Date(3000, 0, 1),
    events: [],
    eventColor: 'primary',
    color: 'primary',
    icon: 'mdi-calendar',
    solo: false,
    filled: false,
    outlined: false,
  },
  argTypes: {
    input: { action: 'input' },
    value: { control: 'date' },
    min: { control: 'date' },
    max: { control: 'date' },
  },
};

export default meta;

type Story = StoryObj<typeof DatePicker>;

export const Basic: Story = {
  render: (args) => ({
    components: { DatePicker },
    props: Object.keys(args),
    template: '<DatePicker v-bind="$props" v-on="$props" />',
  }),
};
