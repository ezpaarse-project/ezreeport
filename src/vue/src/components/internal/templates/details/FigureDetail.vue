<template>
  <v-sheet
    v-if="figure"
    rounded
    outlined
    class="pa-2"
  >
    <!-- TODO: Move to only dialog for whole template -->
    <FigureDialogEdition
      v-model="isFigureDialogEditionShown"
      :figure="figure"
      :param-form="figureParamsForm"
      readonly
    />

    <v-form>
      <div class="d-flex align-center">
        {{ figureTitle }}
      </div>

      <v-select
        :label="$t('headers.type')"
        :value="figure.type"
        :items="figureTypes"
        readonly
        item-text="label"
        item-value="value"
      >
        <template #prepend>
          <v-icon>{{ figureIcons[figure.type] }}</v-icon>
        </template>
      </v-select>

      <v-btn v-if="figureParamsForm" x-large block @click="isFigureDialogEditionShown = true">
        {{ $t('headers.configuration') }}
      </v-btn>

      <v-select
        :label="$t('headers.slots')"
        :value="figure.slots || []"
        :items="availableSlots"
        readonly
        multiple
      />
    </v-form>
  </v-sheet>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { AnyCustomFigure } from '~/lib/templates/customTemplates';
import { figureTypes, figureIcons } from '~/lib/templates/figures';
import figureFormMap from '~/components/internal/utils/figures';
import useTemplateStore from '~/stores/template';

export default defineComponent({
  props: {
    id: {
      type: String,
      required: true,
    },
    layoutId: {
      type: String,
      required: true,
    },
    takenSlots: {
      type: Array as PropType<number[]>,
      default: () => [],
    },
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    isFigureDialogEditionShown: false,
    figureIcons,
  }),
  computed: {
    figure(): AnyCustomFigure | undefined {
      const layout = this.templateStore.currentLayouts.find(
        ({ _: { id } }) => id === this.layoutId,
      );
      return layout?.figures.find(({ _: { id } }) => id === this.id);
    },
    /**
     * Available slots
     */
    availableSlots() {
      if (!this.figure) {
        return [];
      }

      const length = this.templateStore.currentGrid.cols * this.templateStore.currentGrid.rows;

      const takenSet = new Set(this.takenSlots);
      const slotsSet = new Set(this.figure.slots);
      return Array.from({ length }, (_, i) => ({
        text: this.$t(`slots[${i}]`),
        value: i,
        disabled: takenSet.has(i) && !slotsSet.has(i),
      }));
    },
    /**
     * Localized figure types
     */
    figureTypes() {
      return figureTypes.map((value) => ({
        label: this.$t(`figure_types.${value}`),
        value,
      }));
    },
    /**
     * Components that holds figure params
     */
    figureParamsForm() {
      if (!this.figure) {
        return undefined;
      }

      const component = figureFormMap[this.figure.type];
      if (component !== undefined) {
        return component;
      }
      // eslint-disable-next-line no-underscore-dangle
      return figureFormMap._default;
    },
    /**
     * Returns the title of the figure
     */
    figureTitle() {
      if (!this.figure) {
        return '';
      }

      const title = this.figure.params?.title;
      if (title) {
        return title;
      }

      return this.$t(`figure_types.${this.figure.type}`);
    },
  },
});
</script>

<style scoped>
</style>

<i18n lang="yaml">
en:
  headers:
    figure: '{type} Figure'
    type: 'Figure type'
    data: 'Figure data'
    figureParams: 'Figure params'
    slots: 'Figure slot(s)'
  figure_types:
    table: 'Table'
    md: 'Markdown'
    metric: 'Metrics'
    arc: 'Arc'
    area: 'Area'
    bar: 'Bar'
    line: 'Line'
    point: 'Point'
    rect: 'Rect'
    rule: 'Rule'
    text: 'Text'
    tick: 'Tick'
    trail: 'Trail'
    circle: 'Circle'
    square: 'Square'
  slots:
    - 'Top left'
    - 'Top right'
    - 'Bottom left'
    - 'Bottom right'
fr:
  headers:
    figure: 'Visualisation {type}'
    type: 'Type de visualisation'
    data: 'Données de la visualisation'
    figureParams: 'Paramètres de la visualisation'
    slots: 'Emplacements de la visualisation'
  figure_types:
    table: 'Table'
    md: 'Markdown'
    metric: 'Métriques'
    arc: 'Circulaire'
    area: 'Aire'
    bar: 'Bâtons'
    line: 'Courbes'
    point: 'Nuage de point'
    rect: 'Rectangle'
    rule: 'Règle'
    text: 'Texte'
    tick: 'Tick' # TODO French translation
    trail: 'Trail' # TODO French translation
    circle: 'Cercle'
    square: 'Carré'
  slots:
    - 'Haut à gauche'
    - 'Haut à droite'
    - 'Bas à gauche'
    - 'Bas à droite'
</i18n>
