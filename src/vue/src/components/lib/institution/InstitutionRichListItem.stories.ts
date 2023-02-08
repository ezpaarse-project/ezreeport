import type { Meta, StoryObj } from '@storybook/vue';
import InstitutionRichListItem from './InstitutionRichListItem.vue';

const meta: Meta<typeof InstitutionRichListItem> = {
  title: 'Institutions/Internal/InstitutionRichListItem',
  component: InstitutionRichListItem,
  args: {
    institution: {
      id: 'bib-cnrs-inist',
      name: 'Inist-CNRS Bibcnrs',
      city: 'Vandœuvre-lès-Nancy',
      logoId: 'd80d56af8ee12a08a4be022dd544dc2b.png',
      acronym: 'CNRS',
      createdAt: new Date(),
      auto: {
        ezmesure: false,
        ezpaarse: false,
        report: false,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof InstitutionRichListItem>;

export const Basic: Story = {
  render: (args) => ({
    components: { InstitutionRichListItem },
    props: Object.keys(args),
    template: '<InstitutionRichListItem v-bind="$props" v-on="$props" />',
  }),
};
