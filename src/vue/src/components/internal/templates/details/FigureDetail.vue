<template>
  <v-sheet rounded outlined class="pa-2">
    <div class="d-flex align-center">
      {{ $t('headers.figure', { i: figureIndex }) }}

      <template v-if="locked">
        <v-spacer />

        <v-icon color="black" dense>mdi-lock</v-icon>
      </template>
    </div>

    <v-select
      :label="$t('headers.type')"
      :value="figure.type"
      :items="figureTypes"
      item-text="label"
      item-value="value"
      readonly
    />

    <v-textarea
      v-if="figure.data && figure.type === 'md'"
      :value="figure.data"
      :label="$t('headers.data')"
      readonly
    />

    <CustomSection v-else-if="Array.isArray(figure.data)">
      <ToggleableObjectTree
        :label="$t('headers.data').toString()"
        :value="figure.data"
      />
    </CustomSection>

    <CustomSection
      v-if="figureParamsForm"
      :label="$t('headers.figureParams').toString()"
      collapsable
      style="background: transparent;"
    >
      <component
        :is="figureParamsForm"
        :value="figure.params || {}"
        readonly
        @input="$emit('update:figure', { ...figure, params: $event })"
      />
    </CustomSection>

    <v-select
      :label="$t('headers.slots')"
      :value="figure.slots || []"
      :items="availableSlots"
      multiple
      readonly
    />
  </v-sheet>
</template>

<script lang="ts">
import type { templates } from '@ezpaarse-project/ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';
import figureFormMap from '~/components/internal/utils/figures';

export default defineComponent({
  props: {
    figure: {
      type: Object as PropType<templates.Figure>,
      required: true,
    },
    figureIndex: {
      type: Number,
      required: true,
    },
    grid: {
      type: Object as PropType<{ rows: number, cols: number }>,
      default: () => ({ cols: 2, rows: 2 }),
    },
    locked: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    availableSlots() {
      const length = this.grid.cols * this.grid.rows;

      return Array.from({ length }, (_, i) => i);
    },
    figureTypes() {
      const types = [
        // Vega types
        'arc',
        'area',
        'bar',
        // 'image',
        'line',
        'point',
        'rect',
        'rule',
        'text',
        'tick',
        'trail',
        'circle',
        'square',
        // Custom types
        'table',
        'md',
        'metric',
      ];

      return types.map((value) => ({
        label: this.$t(`figure_types.${value}`),
        value,
      }));
    },
    /**
     * Components that holds figure params
     */
    figureParamsForm() {
      const component = figureFormMap[this.figure.type];
      if (component !== undefined) {
        return component;
      }
      // eslint-disable-next-line no-underscore-dangle
      return figureFormMap._default;
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  headers:
    figure: 'Figure'
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
fr:
  headers:
    figure: 'Visualisation #{i}'
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
</i18n>
