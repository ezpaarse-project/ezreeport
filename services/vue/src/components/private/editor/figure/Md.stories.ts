import type { Meta, StoryObj } from '@storybook/vue3';

import { createMdFigureHelper } from '~sdk/helpers/figures';

import EditorFigureMd from './Md.vue';

const meta: Meta<typeof EditorFigureMd> = {
  title: 'Template Editor/Figures/Markdown',
  component: EditorFigureMd,
};

export default meta;

const mockData = "![ezMESURE](https://raw.githubusercontent.com/ezpaarse-project/ezpaarse-project.github.io/master/ezmesure/static/images/logo-ezMESURE-350.png)\n## Tableau de bord OMEKA \nIl s'agit du tableau de bord des plateformes OMEKA et OMEKA S chargé dans votre espace ezMESURE  de vos données d'usages traitées par ezPAARSE.\n\nRappel: \n  -  [C'est quoi OMEKA ?](https://www.inist.fr/realisations/omeka-pour-des-bases-de-donnees-valorisees/) .\n \n\n N'hésitez pas à consulter le blog Readmetrics pour d'autres informations (tutos, FAQ, Supports mutualisés) (https://blog.readmetrics.org/)\n\nL'équipe ezTEAM.";

type Story = StoryObj<typeof EditorFigureMd>;

export const New: Story = {
  render: (args) => ({
    components: { EditorFigureMd },
    setup() {
      return { args };
    },
    template: '<EditorFigureMd v-bind="args" />',
  }),
  args: {
    modelValue: createMdFigureHelper(),
  },
};

export const Existing: Story = {
  render: (args) => ({
    components: { EditorFigureMd },
    setup() {
      return { args };
    },
    template: '<EditorFigureMd v-bind="args" />',
  }),
  args: {
    modelValue: createMdFigureHelper(mockData),
  },
};

export const Readonly: Story = {
  render: (args) => ({
    components: { EditorFigureMd },
    setup() {
      return { args };
    },
    template: '<EditorFigureMd v-bind="args" />',
  }),
  args: {
    modelValue: createMdFigureHelper(mockData),
    readonly: true,
  },
};
