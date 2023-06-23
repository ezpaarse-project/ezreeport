<template>
  <v-row>
    <v-col>
      <FigureElasticForm
        :layout-id="layoutId"
        :readonly="readonly"
      />
    </v-col>

    <v-divider vertical class="mt-4" />

    <v-col>
      <MetricsFigurePopover
        v-if="currentLabel"
        v-model="labelPopoverShown"
        :element="currentLabel"
        :coords="labelPopoverCoords"
        :readonly="readonly"
        :currentKeyFields="currentFigureKeyFields"
        :availableAggs="availableAggs"
        @updated="onCurrentLabelUpdated"
      />

      <CustomSection :label="$t('headers.labels').toString()">
        <template #actions>
          <v-btn
            v-if="!readonly"
            icon
            x-small
            color="success"
            @click="showLabelPopover($event)"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </template>

        <v-list dense rounded>
          <v-list-item
            v-for="(label, i) in labels"
            :key="label._.dataKeyField"
            :draggable="label._.dragged"
            :ripple="!label._.dragged"
            :class="[label._.dragged && 'v-item--active primary--text']"
            v-on="getEventListeners(label, i)"
          >
            <v-list-item-action v-if="!readonly">
              <v-btn
                icon
                small
                @click="onLabelDelete(label)"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-list-item-action>

            <v-list-item-content>
              <v-list-item-title>
                {{ label.dataKey }}<span style="font-weight: normal;">.{{ label.field || 'value' }}</span>
              </v-list-item-title>

              <v-list-item-subtitle v-if="label.text">
                {{ label.text }}
              </v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-action
              v-if="!readonly"
              class="metric--handle"
              @mousedown="allowDrag(label)"
              @mouseup="disallowDrag(label)"
            >
              <v-icon>mdi-drag-horizontal-variant</v-icon>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </CustomSection>

      <!-- Advanced -->
      <CustomSection v-if="unsupportedFigureParams.shouldShow">
        <ToggleableObjectTree
          :value="unsupportedFigureParams.value"
          :label="$t('headers.advanced').toString()"
          v-on="unsupportedFigureParams.listeners"
        />
      </CustomSection>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { merge, omit } from 'lodash';
import { defineComponent } from 'vue';
import useTemplateStore from '~/stores/template';

const dragFormat = 'custom/figure-metric-json';

// Extracted from `src/services/report/lib/pdf/metrics.ts`
export type Label = {
  dataKey: string,
  text?: string,
  field?: string,
  format?: {
    type: string,
    params?: string[]
  }
};
type CustomLabel = Label & {
  _: {
    dataKeyField: string,
    dragged: boolean,
  }
};
// Extracted from `src/services/report/lib/pdf/metrics.ts`
type MetricParams = {
  labels: Label[]
};

const supportedKeys = [
  'labels',
];

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
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    labelPopoverShown: false,
    labelPopoverCoords: { x: 0, y: 0 },
    currentLabel: undefined as Label | undefined,

    innerLabels: [] as CustomLabel[],
    draggedIndex: -1,
  }),
  computed: {
    figureParams: {
      get(): MetricParams | undefined {
        const layout = this.templateStore.currentLayouts.find(
          ({ _: { id } }) => id === this.layoutId,
        );

        const figure = layout?.figures.find(({ _: { id } }) => id === this.id);
        if (!figure?.params) {
          return undefined;
        }

        const params: MetricParams = { labels: [] };
        if ('labels' in figure.params && Array.isArray(figure.params.labels)) {
          // TODO: Better Validation
          params.labels = figure.params.labels as Label[];
        }

        return params;
      },
      set(params: MetricParams) {
        const layout = this.templateStore.currentLayouts.find(
          ({ _: { id } }) => id === this.layoutId,
        );

        const figure = layout?.figures.find(({ _: { id } }) => id === this.id);
        if (!figure) {
          return;
        }

        this.templateStore.UPDATE_FIGURE(
          this.layoutId,
          this.id,
          {
            ...figure,
            params,
          },
        );
      },
    },
    labels: {
      get(): CustomLabel[] {
        if (this.innerLabels.length > 0) {
          return this.innerLabels;
        }

        if (!this.figureParams?.labels) {
          return [];
        }

        return this.figureParams.labels.map((l) => ({
          ...l,
          _: {
            dragged: false,
            dataKeyField: `${l.dataKey}.${l.field || 'value'}`,
          },
        }));
      },
      set(val: CustomLabel[]) {
        this.innerLabels = val;
      },
    },
    currentFigureKeyFields() {
      return this.labels.map(({ _: { dataKeyField } }) => dataKeyField);
    },
    unsupportedFigureParams() {
      let listeners = {};
      if (!this.readonly) {
        listeners = {
          input: (val: Record<string, any>) => {
            this.figureParams = merge(this.figureParams, val);
          },
        };
      }

      const value = omit(this.figureParams, supportedKeys);
      return {
        shouldShow: !this.readonly || Object.keys(value).length > 0,
        value,
        listeners,
      };
    },
    availableAggs() {
      const layout = this.templateStore.currentLayouts.find(
        ({ _: { id } }) => id === this.layoutId,
      );
      if (!layout || !layout.fetchOptions) {
        return [];
      }

      const aggs = 'aggs' in layout.fetchOptions ? layout.fetchOptions.aggs : layout.fetchOptions.aggregations;
      if (!Array.isArray(aggs)) {
        return [];
      }

      const available = (aggs as { name: string }[]).map((agg, i) => agg.name || `agg${i}`);
      const currentFigureKeySet = new Set(this.labels.map((l) => l.dataKey));
      return available.filter(
        (agg) => !currentFigureKeySet.has(agg)
          || agg === this.currentLabel?.dataKey,
      );
    },
  },
  methods: {
    /**
     * Update value when a label is deleted
     *
     * @param label The label to delete
     */
    onLabelDelete(label: CustomLabel) {
      const index = this.labels.findIndex(
        ({ _: { dataKeyField } }) => dataKeyField === label._.dataKeyField,
      );
      if (index < 0 || !this.figureParams) {
        return;
      }

      const labels = [...this.figureParams.labels];
      labels.splice(index, 1);
      this.figureParams = { ...this.figureParams, labels };
    },
    /**
     * Update value when a label is updated
     *
     * @param label The new label
     */
    onCurrentLabelUpdated(label: Label) {
      if (!this.currentLabel || !this.figureParams) {
        return;
      }

      const value = omit(label, '_');
      const labels = [...this.figureParams.labels];
      const { dataKey: dK, field: f } = this.currentLabel;
      const index = this.labels.findIndex(
        ({ dataKey, field }) => dataKey === dK && field === f,
      );
      if (index < 0) {
        labels.push(value);
      } else {
        labels.splice(index, 1, value);
      }
      this.figureParams = { ...this.figureParams, labels };
      this.currentLabel = label;
    },
    /**
     * Show popover for creating/editing label
     */
    async showLabelPopover(e: MouseEvent, label?: CustomLabel) {
      if (!this.figureParams) {
        return;
      }

      if (label) {
        this.currentLabel = label;
      } else {
        this.currentLabel = { dataKey: `agg${this.labels.length}` };
        const labels = [...this.figureParams.labels, this.currentLabel];
        this.figureParams = { ...this.figureParams, labels };
      }

      const coords = { x: e.clientX, y: e.clientY };
      const target = (e.currentTarget as HTMLElement | undefined);
      if (target && label) {
        const bounding = target.getBoundingClientRect();

        // Adding close icon offset
        coords.x = bounding.x + 60;
        coords.y = bounding.y + (bounding.height / 2);
      }

      this.labelPopoverCoords = coords;
      await this.$nextTick();
      this.labelPopoverShown = true;
    },
    /**
     * Allow drag of item when it's handle is clicked
     *
     * @param label The label allowed to be dragged
     */
    allowDrag(label: CustomLabel) {
      const index = this.labels.findIndex(
        ({ _: { dataKeyField } }) => dataKeyField === label._.dataKeyField,
      );

      if (index >= 0 && !this.readonly) {
        const labels = [...this.labels];
        labels.splice(index, 1, { ...label, _: { ...label._, dragged: true } });
        this.labels = labels;
      }
    },
    /**
     * Disallow drag of item when it's handle is no longer clicked
     *
     * @param label The label disallowed to be dragged
     */
    disallowDrag(label: CustomLabel) {
      const index = this.labels.findIndex(
        ({ _: { dataKeyField } }) => dataKeyField === label._.dataKeyField,
      );

      if (index >= 0 && !this.readonly) {
        const labels = [...this.labels];
        labels.splice(index, 1, { ...label, _: { ...label._, dragged: false } });
        this.labels = labels;
      }
    },
    /**
     * Get event listeners for
     */
    getEventListeners(label: CustomLabel, i: number) {
      let events = {};
      if (!this.readonly) {
        events = {
          ...events,
          dragstart: (e: DragEvent) => { e.stopPropagation(); this.onDragStart(e, label, i); },
          dragend: (e: DragEvent) => { e.stopPropagation(); this.onDragEnd(); },
          dragover: (e: DragEvent) => { e.stopPropagation(); this.onDragOver(e); },
          dragenter: (e: DragEvent) => { e.stopPropagation(); this.onDragEnter(e, i); },
          drop: (e: DragEvent) => { e.stopPropagation(); this.onDragDrop(e); },
        };
      }
      if (this.draggedIndex < 0) {
        events = {
          ...events,
          click: (e: MouseEvent) => { this.showLabelPopover(e, label); },
        };
      }

      return events;
    },
    /**
     * Init dragged data
     *
     * @param ev The event
     * @param label The dragged item
     * @param index The index of the dragged item
     */
    onDragStart(ev: DragEvent, label: CustomLabel, index: number) {
      if (!this.readonly) {
        // Init data
        this.draggedIndex = index;
        const img = new Image();
        ev.dataTransfer?.setDragImage(img, 0, 0);
        ev.dataTransfer?.setData(
          dragFormat,
          JSON.stringify({
            index,
            item: label,
          }),
        );
      }
    },
    /**
     * Update labels & inner dragged state
     */
    async onDragEnd() {
      if (!this.figureParams || this.readonly || this.draggedIndex < 0) {
        return;
      }

      this.disallowDrag(this.labels[this.draggedIndex]);

      const labels = this.labels.map((l) => omit(l, '_'));
      this.figureParams = { ...this.figureParams, labels };
      await this.$nextTick();
      this.labels = [];
      this.draggedIndex = -1;
    },
    /**
     * Allow dropping on this element
     *
     * @param ev The event
     */
    onDragOver(ev: DragEvent) {
      if (!this.readonly && ev.dataTransfer?.types.includes(dragFormat)) {
        ev.preventDefault();
      }
    },
    /**
     * Update labels state that current element is hovered
     *
     * @param ev The event
     * @param newIndex The new index
     */
    onDragEnter(ev: DragEvent, newIndex: number) {
      if (
        this.readonly
        || newIndex === this.draggedIndex
        || !ev.dataTransfer?.types.includes(dragFormat)
      ) {
        return;
      }

      const labels = [...this.labels];
      labels.splice(this.draggedIndex, 1);
      labels.splice(newIndex, 0, this.labels[this.draggedIndex]);
      this.labels = labels;

      this.draggedIndex = newIndex;
    },
    /**
     * End dragging data
     *
     * @param ev The event
     */
    onDragDrop(ev: DragEvent) {
      const data = ev.dataTransfer?.getData(dragFormat);
      if (!this.readonly && data) {
        ev.dataTransfer?.clearData(dragFormat);
      }
    },
  },
});
</script>

<style scoped>
.metric--handle {
  cursor: grab;
}

.v-item--active::before {
  background-color: currentColor;
  bottom: 0;
  content: "";
  left: 0;
  opacity: 0.12;
  pointer-events: none;
  position: absolute;
  right: 0;
  top: 0;
}
</style>

<i18n lang="yaml">
en:
  headers:
    labels: 'Elements'
    advanced: 'Advanced parameters'
fr:
  headers:
    labels: 'Élements'
    advanced: 'Paramètres avancés'
</i18n>
