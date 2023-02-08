<template>
  <v-sheet rounded outlined class="pa-2">
    <v-form @input="$emit('validation', $event)">
      <div class="d-flex">
        <div>
          {{ $t('headers.figure', { id }) }}
          <v-icon v-if="figure._.hasError" color="warning" small>mdi-alert</v-icon>
        </div>

        <v-spacer />

        <v-btn icon color="error" x-small @click="$emit('delete:figure', figure)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </div>

      <v-select
        :label="$t('headers.type')"
        :value="figure.type"
        :items="figureTypes"
        :rules="rules.type"
        item-text="label"
        item-value="value"
        @change="onFigureTypeChange"
      />

      <v-textarea
        v-if="figure.type === 'md'"
        :value="figure.data || ''"
        :label="$t('headers.data')"
        :rules="rules.data"
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
        :rules="rules.slots"
        multiple
        @change="$emit('update:figure', { ...figure, slots: $event })"
      />
    </v-form>
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
      type: Object as PropType<{ rows: number, cols: number }>,
      default: () => ({ cols: 2, rows: 2 }),
    },
    takenSlots: {
      type: Array as PropType<number[]>,
      default: () => [],
    },
  },
  emits: {
    'update:figure': (val: AnyCustomFigure) => !!val,
    'delete:figure': (val: AnyCustomFigure) => !!val,
    validation: (val: boolean) => val !== undefined,
  },
  data: () => ({
    dataMap: {} as Record<string, string | unknown[] | undefined>,
  }),
  computed: {
    rules() {
      return {
        type: [
          (v: string) => !!v || this.$t('errors.empty'),
        ],
        data: [],
        slots: [
          (slots: number[]) => {
            if (slots.length === this.grid.cols * this.grid.rows) {
              return true;
            }

            // Check if slot combinaison is possible, extracted from vega-pdf
            // TODO[feat]: support complex squares
            const isSameRow = slots.every(
              // Every slot on same row
              (s, row) => Math.floor(s / this.grid.cols) === Math.floor(slots[0] / this.grid.cols)
                // Possible (ex: we have 3 cols, and we're asking for col 1 & 3 but not 2)
                && (row === 0 || s - slots[row - 1] === 1),
            );
            const isSameCol = slots.every(
              // Every slot on same colon
              (s, col) => s % this.grid.cols === slots[0] % this.grid.cols
                // Possible (ex: we have 3 rows, and we're asking for row 1 & 3 but not 2)
                && (col === 0 || s - slots[col - 1] === this.grid.cols),
            );

            return isSameRow || isSameCol || this.$t('errors.slots');
          },
        ],
      };
    },
    availableSlots() {
      const length = this.grid.cols * this.grid.rows;

      return Array.from({ length }, (_, i) => ({
        text: i,
        valued: i,
        disabled: this.takenSlots.includes(i) && !this.figure.slots?.includes(i),
      }));
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
  errors:
    empty: 'This field is required'
    slots: "This combinaison of slots is not possible"
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
  errors:
    empty: 'Ce champ est requis'
    slots: "Cette combinaison d'emplacement n'est pas possible"
</i18n>
