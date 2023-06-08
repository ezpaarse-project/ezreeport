<template>
  <v-sheet
    :draggable="preventDrag"
    rounded
    outlined
    class="pa-2"
    @mousedown="onDragAttempt"
    @dragstart="preventEvent"
  >
    <v-form @input="onValidationChange">
      <div class="d-flex align-center">
        <v-icon v-if="draggable" class="figure-handle">mdi-drag</v-icon>

        {{ $t('headers.figure', { i: figureIndex }) }}

        <v-tooltip top v-if="figure._.valid !== true" color="warning">
          <template #activator="{ attrs, on }">
            <v-icon
              color="warning"
              small
              v-bind="attrs"
              v-on="on"
            >
              mdi-alert
            </v-icon>
          </template>

          <span>{{ figure._.valid }}</span>
        </v-tooltip>

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
        hide-details="auto"
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
      <CustomSection v-else>
        <ToggleableObjectTree
          :label="$t('headers.data').toString()"
          :value="Array.isArray(figure.data) ? figure.data : []"
          @input="
            Array.isArray($event)
              && $emit('update:figure', { ...figure, data: $event })
          "
        />
      </CustomSection>

      <CustomSection v-if="figureParamsForm" :label="$t('headers.figureParams').toString()" collapsable>
        <component :is="figureParamsForm" :value="figure.params || {}" @input="$emit('update:figure', { ...figure, params: $event })" />
      </CustomSection>

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
import type { AnyCustomFigure } from '~/lib/templates/customTemplates';
import { figureTypes } from '~/lib/templates/figures';
import figureFormMap from '~/components/internal/utils/figures';

export default defineComponent({
  props: {
    figure: {
      type: Object as PropType<AnyCustomFigure>,
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
    takenSlots: {
      type: Array as PropType<number[]>,
      default: () => [],
    },
    draggable: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    'update:figure': (val: AnyCustomFigure) => !!val,
    'delete:figure': (val: AnyCustomFigure) => !!val,
    validation: (val: true | string) => !!val,
  },
  data: () => ({
    dataMap: {} as Record<string, string | unknown[] | undefined>,
    preventDrag: false,
  }),
  computed: {
    /**
     * Validation rules
     */
    rules(): Record<string, ((v: any) => true | string)[]> {
      return {
        type: [
          (v) => !!v || this.$t('errors.empty').toString(),
        ],
        data: [],
        slots: [
          (v) => {
            if (!v) {
              return true;
            }

            const slots = [...v].sort();
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

            return isSameRow || isSameCol || this.$t('errors.slots').toString();
          },
        ],
      };
    },
    /**
     * Keeps track of validation state within the form
     */
    validationMap() {
      const validationMap = new Map<keyof AnyCustomFigure, true | string>();
      // eslint-disable-next-line no-restricted-syntax
      for (const [field, rules] of Object.entries(this.rules)) {
        const key = field as keyof AnyCustomFigure;
        validationMap.set(
          key,
          rules.map((cb) => cb(this.figure[key])).find((v) => v !== true) || true,
        );
      }

      return Object.fromEntries(validationMap.entries());
    },
    /**
     * Available slots
     */
    availableSlots() {
      const length = this.grid.cols * this.grid.rows;

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
      const component = figureFormMap[this.figure.type];
      if (component !== undefined) {
        return component;
      }
      // eslint-disable-next-line no-underscore-dangle
      return figureFormMap._default;
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
    onValidationChange() {
      const validationResult = Object.values(this.validationMap).find((v) => v !== true) || true;
      this.$emit('validation', validationResult);
    },
    onDragAttempt(ev: DragEvent) {
      if (!(ev.target as HTMLElement).classList.contains('figure-handle')) {
        this.preventDrag = true;
      }
    },
    preventEvent(ev: Event) {
      ev.preventDefault();
      ev.stopPropagation();
      this.preventDrag = false;
    },
  },
});
</script>

<style scoped>
.figure-handle {
  cursor: grab;
}
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
  slots:
    - 'Top left'
    - 'Top right'
    - 'Bottom left'
    - 'Bottom right'
  errors:
    empty: 'This field is required'
    slots: "This combinaison of slots is not possible"
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
  slots:
    - 'Haut à gauche'
    - 'Haut à droite'
    - 'Bas à gauche'
    - 'Bas à droite'
  errors:
    empty: 'Ce champ est requis'
    slots: "Cette combinaison d'emplacement n'est pas possible"
</i18n>
