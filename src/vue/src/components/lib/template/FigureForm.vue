<template>
  <v-sheet rounded outlined class="pa-2">
    <div class="d-flex">
      {{ $t('headers.figure', { id }) }}

      <v-spacer />

      <v-btn icon color="error" x-small @click="$emit('delete:figure', figure)">
        <v-icon>mdi-delete</v-icon>
      </v-btn>
    </div>

    <v-select
      :label="$t('headers.type')"
      :value="figure.type"
      :items="figureTypes"
      item-text="label"
      item-value="value"
      @change="onFigureTypeChange"
    />

    <v-textarea
      v-if="figure.type === 'md'"
      :value="figure.data || ''"
      :label="$t('headers.data')"
      @blur="onMdChange"
    />

    <!-- TODO: choose if custom param -->
    <v-sheet
      v-else
      rounded
      outlined
      class="my-2 pa-2"
    >
      <ToggleableObjectTree
        :label="$t('headers.data').toString()"
        :value="Array.isArray(figure.data) ? figure.data : []"
        @input="
          Array.isArray($event)
            && $emit('update:figure', { ...figure, data: $event })
        "
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
        @input="
          !Array.isArray($event)
            && $emit('update:figure', { ...figure, params: $event })
        "
      />
    </v-sheet>

    <v-select
      :label="$t('headers.slots')"
      :value="figure.slots || []"
      :items="availableSlots"
      multiple
      @change="$emit('update:figure', { ...figure, slots: $event })"
    />
  </v-sheet>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { AnyCustomFigure } from './customTemplates';

export default defineComponent({
  props: {
    figure: {
      type: Object as PropType<AnyCustomFigure>,
      required: true,
    },
    id: {
      type: [Number, String],
      required: true,
    },
    grid: {
      type: Object as PropType<{ rows: number, cols: number } | undefined>,
      default: undefined,
    },
  },
  emits: {
    'update:figure': (val: AnyCustomFigure) => !!val,
    'delete:figure': (val: AnyCustomFigure) => !!val,
  },
  data: () => ({
    dataMap: {} as Record<string, string | unknown[] | undefined>,
  }),
  computed: {
    availableSlots() {
      // TODO: rules
      const length = this.grid ? this.grid.cols * this.grid.rows : 4;

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
  methods: {
    onFigureTypeChange(type: string) {
      // Backup data for current type
      this.dataMap[this.figure.type] = this.figure.data;
      // Update type
      this.$emit('update:figure', {
        ...this.figure,
        data: this.dataMap[type],
        type,
      });
    },
    onMdChange(e: Event) {
      const { value } = e.target as HTMLInputElement;
      if (value !== this.figure.data) {
        this.$emit('update:figure', { ...this.figure, data: value });
      }
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  headers:
    figure: 'Figure #{id}'
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
    figure: 'Visualisation #{id}'
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
