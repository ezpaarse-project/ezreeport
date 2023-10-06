<template>
  <v-row>
    <v-col>
      <FigureElasticForm
        :layout-id="layoutId"
        :id="id"
        :readonly="readonly"
        @update:fetchOptions="$emit('update:fetchOptions', $event)"
      />

      <MetricsFigurePopover
        v-if="currentLabel"
        v-model="labelPopoverShown"
        :element="currentLabel"
        :linked-agg="aggs.get(currentLabel.dataKey)?.agg"
        :coords="labelPopoverCoords"
        :readonly="readonly"
        :currentKeyFields="currentFigureKeyFields"
        @input="currentLabel = undefined"
        @update:element="onCurrentLabelUpdated"
        @update:linkedAgg="upsertAgg"
        @update:loading="onLoading"
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
                :loading="loadingMap[label._.dataKeyField]"
                icon
                small
                @click="onLabelDelete(label)"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-list-item-action>

            <v-list-item-content>
              <v-list-item-title>
                {{ label.text || `${label.dataKey}.${label.field || 'value'}` }}
              </v-list-item-title>

              <i18n v-if="aggs.get(label.dataKey)" tag="v-list-item-subtitle" path="$ezreeport.fetchOptions.aggSummary" class="font-weight-light text--secondary">
                <template #type>
                  <span class="font-weight-medium">
                    {{ aggs.get(label.dataKey)?.formatted.type }}
                  </span>
                </template>

                <template #field>
                  <span class="font-weight-medium">
                    {{ aggs.get(label.dataKey)?.formatted.field }}
                  </span>
                </template>
              </i18n>
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
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { omit } from 'lodash';
import { defineComponent } from 'vue';
import { v4 as uuid } from 'uuid';

import { getTypeFromAgg, ElasticAgg } from '~/lib/elastic/aggs';
import type { AnyFetchOption } from '~/lib/templates/customTemplates';

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
export type CustomLabel = Label & {
  _: {
    dataKeyField: string,
    dragged: boolean,
  }
};
// Extracted from `src/services/report/lib/pdf/metrics.ts`
type MetricParams = {
  labels: Label[]
};

type AggMapElement = {
  agg: ElasticAgg,
  formatted: {
    name: string,
    type: string,
    field: string,
  }
};

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
  emits: {
    'update:fetchOptions': (data: Partial<AnyFetchOption>) => !!data,
    childOpen: (isOpen: boolean) => isOpen !== undefined,
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    labelPopoverShown: false,
    labelPopoverCoords: { x: 0, y: 0 },
    currentLabel: undefined as CustomLabel | undefined,

    innerLabels: [] as CustomLabel[],
    loadingMap: {} as Record<string, boolean>,
    draggedIndex: -1,
  }),
  computed: {
    figure() {
      const layout = this.templateStore.currentLayouts.find(
        ({ _: { id } }) => id === this.layoutId,
      );

      return layout?.figures.find(({ _: { id } }) => id === this.id);
    },
    figureParams: {
      get(): MetricParams | undefined {
        if (!this.figure?.params) {
          return undefined;
        }

        const params: MetricParams = { labels: [] };
        if ('labels' in this.figure.params && Array.isArray(this.figure.params.labels)) {
          // TODO: Better Validation
          params.labels = this.figure.params.labels as Label[];
        }

        return params;
      },
      set(params: MetricParams) {
        if (!this.figure) {
          return;
        }

        this.templateStore.UPDATE_FIGURE(
          this.layoutId,
          this.id,
          {
            ...this.figure,
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
    aggs() {
      if (!this.figure?.fetchOptions) {
        return new Map<string, AggMapElement>();
      }

      let aggs: ElasticAgg[] = [];
      if ('aggs' in this.figure.fetchOptions) {
        aggs = this.figure.fetchOptions.aggs ?? [];
      }

      return new Map<string, AggMapElement>(
        aggs.map((agg, i) => {
          const type = getTypeFromAgg(agg);
          return [
            agg.name || `agg${i}`,
            {
              agg,
              formatted: {
                name: `${agg.name}` || `agg${i}`,
                type: this.$t(type ? `$ezreeport.fetchOptions.agg_types.${type}` : '$ezreeport.unknown').toString(),
                field: agg[type || '']?.field || 'unknown',
              },
            },
          ];
        }),
      );
    },
    currentFigureKeyFields() {
      return this.labels.map(({ _: { dataKeyField } }) => dataKeyField);
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    'figure.fetchOptions.fetchCount': function (aggName: string | undefined) {
      // Create a label with fetch count
      if (aggName) {
        this.createLabel({
          dataKey: 'total_count',
          field: 'value',
          text: this.$t('total_count').toString(),
          format: {
            type: 'number',
          },
        });
        return;
      }
      // Delete the label if possible
      const label = this.labels.find(({ dataKey }) => dataKey === 'total_count');
      if (label) {
        this.onLabelDelete(label);
      }
    },
    labelPopoverShown(value: boolean) {
      this.$emit('childOpen', value);
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

      if (label.dataKey === 'total_count') {
        this.$emit('update:fetchOptions', { fetchCount: undefined });
        return;
      }

      this.deleteAgg(label.dataKey);
    },
    /**
     * Update value when a label is updated
     *
     * @param label The new label
     */
    onCurrentLabelUpdated(label: CustomLabel) {
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

      if (!label) {
        this.createLabel();
        this.upsertAgg({
          name: this.currentLabel?.dataKey ?? '',
          sum: {
            field: '',
          },
        });
      } else {
        this.currentLabel = label;
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
     * Create a label and set it as current
     *
     * @param label base label
     */
    createLabel(label?: Partial<Label>) {
      if (!this.figureParams) {
        return;
      }

      const dataKey = label?.dataKey ?? uuid().split('-')[0];
      const field = label?.field ?? 'value';

      const t = {
        _: {
          dragged: false,
          dataKeyField: `${dataKey}.${field}`,
        },
        field,
        dataKey,
        ...(label ?? {}),
      };
      const labels = [...this.figureParams.labels, t];
      this.currentLabel = t;
      this.figureParams = { ...this.figureParams, labels };
    },
    /**
     * Upsert a agg in fetchOptions
     *
     * @param agg The agg to upsert
     */
    upsertAgg(agg: ElasticAgg) {
      let aggs: ElasticAgg[] = [];
      if (this.figure?.fetchOptions && 'aggs' in this.figure.fetchOptions) {
        aggs = this.figure.fetchOptions.aggs ?? [];
      }

      const index = aggs.findIndex((b) => b.name === agg.name);
      if (index < 0) {
        aggs.push(agg);
      } else {
        aggs.splice(index, 1, agg);
      }
      this.$emit('update:fetchOptions', { aggs });
    },
    /**
     * Delete a agg in fetchOptions
     *
     * @param agg The agg to upsert
     */
    deleteAgg(name: string) {
      let aggs: ElasticAgg[] = [];
      if (this.figure?.fetchOptions && 'aggs' in this.figure.fetchOptions) {
        aggs = this.figure.fetchOptions.aggs ?? [];
      }

      const index = aggs.findIndex((b) => b.name === name);
      if (index >= 0) {
        aggs.splice(index, 1);
        this.$emit('update:fetchOptions', { aggs });
      }
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
    onLoading(value: boolean) {
      if (!this.currentLabel) {
        return;
      }

      this.loadingMap = {
        ...this.loadingMap,
        [this.currentLabel._.dataKeyField ?? '']: value,
      };
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
  formats:
    date: 'Date'
    number: 'Number'
  total_count: 'Count of documents'
fr:
  headers:
    labels: 'Éléments'
  formats:
    date: 'Date'
    number: 'Nombre'
  total_count: 'Nombre de documents'
</i18n>
