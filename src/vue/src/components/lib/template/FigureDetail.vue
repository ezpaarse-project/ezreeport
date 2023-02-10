<template>
  <v-sheet rounded outlined class="pa-2">
    <div class="d-flex">
      {{ $t('headers.figure') }}

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

    <v-sheet
      v-else-if="Array.isArray(figure.data)"
      rounded
      outlined
      class="my-2 pa-2"
    >
      <ToggleableObjectTree
        :label="$t('headers.data').toString()"
        :value="figure.data"
      />
    </v-sheet>

    <v-sheet
      v-if="figure.params"
      rounded
      outlined
      class="my-2 pa-2"
    >
      <ToggleableObjectTree
        :label="$t('headers.figureParams').toString()"
        :value="figure.params"
      />
    </v-sheet>

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
import type { templates } from 'ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  props: {
    figure: {
      type: Object as PropType<templates.Figure>,
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
    figure: 'Visualisation'
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
