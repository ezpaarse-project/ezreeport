<template>
  <v-simple-table dense>
    <TableColumnPopover
      v-if="currentColumn && columnPopoverShown"
      v-model="columnPopoverShown"
      :coords="columnPopoverCoords"
      :column="currentColumn"
      :total="totalMap[currentColumn.dataKey]"
      :colStyle="colStyles[currentColumn.dataKey]"
      :bucket="columnBucketMap.get(currentColumn.dataKey)?.bucket"
      :readonly="readonly"
      @loading="loadingMap[currentColumn.dataKey] = $event"
      @update:column="onCurrentColumnUpdated"
      @update:total="onCurrentColumnTotalUpdated"
      @update:bucket="upsertBucket"
      @update:colStyle="onCurrentColumnStyleUpdated"
    />

    <thead>
      <tr>
        <th
          v-for="(column, i) in columns"
          :key="`${column.dataKey}-header`"
        >
          <div
            class="d-flex align-center"
            :draggable="column._.dragged"
            :class="[column._.dragged && 'primary--text']"
            @dragstart.stop="onDragStart($event, column, i)"
            @dragend.stop="onDragEnd"
            @dragover.stop="onDragOver"
            @dragenter.stop="onDragEnter($event, i)"
            @drop.stop="onDragDrop"
          >
            <v-icon
              v-if="!readonly && valueColumn?.dataKey !== column.dataKey"
              :disabled="loadingMap[column.dataKey]"
              x-small
              class="mr-1"
              style="cursor: grab;"
              @mousedown="allowDrag(column)"
              @mouseup="disallowDrag(column)"
            >
              mdi-drag-vertical-variant
            </v-icon>

            <span class="mr-1">
              {{ column.header }}
            </span>

            <v-btn
              v-if="!readonly && valueColumn?.dataKey !== column.dataKey"
              :disabled="loadingMap[column.dataKey]"
              icon
              x-small
              color="error"
              @click="deleteColumn(column)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>

            <v-btn
              :loading="loadingMap[column.dataKey]"
              icon
              x-small
              @click="openColumnDialog($event, column)"
            >
              <v-icon>mdi-cog</v-icon>
            </v-btn>
          </div>
        </th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td v-for="{ dataKey } in columns" :key="`${dataKey}-value`">
          <!-- Bucket summary -->
          <i18n v-if="columnBucketMap.get(dataKey)" tag="span" path="$ezreeport.fetchOptions.aggSummary" class="font-weight-light text--secondary">
            <template #type>
              <span class="font-weight-medium">
                {{ columnBucketMap.get(dataKey)?.formatted.type }}
              </span>
            </template>

            <template #field>
              <span class="font-weight-medium">
                {{ columnBucketMap.get(dataKey)?.formatted.field }}
              </span>
            </template>
          </i18n>

          <!-- Metric summary -->
          <i18n v-else-if="metricFormatted" tag="span" path="$ezreeport.fetchOptions.aggSummary" class="font-weight-light text--secondary">
            <template #type>
              <span class="font-weight-medium">
                {{ metricFormatted?.formatted.type }}
              </span>
            </template>

            <template #field>
              <span class="font-weight-medium">
                {{ metricFormatted?.formatted.field }}
              </span>
            </template>
          </i18n>

          <!-- Fallback -->
          <span v-else class="font-weight-medium text--secondary">
            {{ $t('$ezreeport.fetchOptions.agg_types.__count') }}
          </span>
        </td>
      </tr>
      <tr v-if="totals.length > 0">
        <td v-for="{ dataKey } in columns" :key="`${dataKey}-total`">
          <template v-if="totalMap[dataKey]">
            {{ $t('headers.total') }}
          </template>
        </td>
      </tr>
    </tbody>
  </v-simple-table>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { omit } from 'lodash';
import { v4 as uuid } from 'uuid';

import { getTypeFromAgg, type ElasticAgg } from '~/lib/elastic/aggs';

import type { PDFStyle, TableColumn } from './table';

const dragFormat = 'custom/figure-table-json';

type CustomTableColumn = TableColumn & {
  _: {
    dragged: boolean,
  },
};

export default defineComponent({
  props: {
    value: {
      type: Array as PropType<TableColumn[]>,
      required: true,
    },
    totals: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    colStyles: {
      type: Object as PropType<Record<string, PDFStyle>>,
      default: () => ({}),
    },
    buckets: {
      type: Array as PropType<ElasticAgg[]>,
      default: () => [],
    },
    metric: {
      type: Object as PropType<ElasticAgg | undefined>,
      default: undefined,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    input: (cols: TableColumn[]) => !!cols,
    'update:totals': (totals: string[]) => !!totals,
    'update:col-styles': (colStyles: Record<string, PDFStyle>) => !!colStyles,
    'update:buckets': (buckets: ElasticAgg[]) => !!buckets,
  },
  data: () => ({
    columnPopoverShown: false,
    columnPopoverCoords: { x: 0, y: 0 },

    innerColumns: [] as CustomTableColumn[],
    innerBuckets: [] as ElasticAgg[],
    loadingMap: {} as Record<string, boolean>,
    currentColumn: undefined as TableColumn | undefined,
    draggedIndex: -1,
  }),
  computed: {
    columns: {
      get(): CustomTableColumn[] {
        if (this.innerColumns.length > 0) {
          return this.innerColumns;
        }

        return this.value.map((c) => ({
          ...c,
          _: {
            dragged: false,
          },
        }));
      },
      set(val: CustomTableColumn[]) {
        this.innerColumns = val;
      },
    },
    columnBucketMap() {
      const bucketMap = new Map<string, ElasticAgg>(this.buckets.map((b, i) => [b.name || `agg${i}`, b]));

      return new Map(
        this.columns
          .filter((c) => c.dataKey !== this.valueColumn?.dataKey)
          .map((c, i) => {
            const bucketName = this.getBucketNameFromDK(c.dataKey);
            const bucket = bucketMap.get(bucketName ?? '');
            if (!bucket) {
              return [c.dataKey, undefined];
            }

            const type = getTypeFromAgg(bucket);
            return [
              c.dataKey,
              {
                bucket,
                formatted: {
                  name: `${bucket.name}` || `agg${i}`,
                  type: this.$t(type ? `$ezreeport.fetchOptions.agg_types.${type}` : '$ezreeport.unknown').toString(),
                  field: bucket[type || '']?.field || 'unknown',
                },
              },
            ];
          }),
      );
    },
    metricFormatted() {
      if (!this.metric) {
        return undefined;
      }

      const type = getTypeFromAgg(this.metric);
      return {
        metric: this.metric,
        formatted: {
          name: `${this.metric.name}` || 'metricAgg',
          type: this.$t(type ? `$ezreeport.fetchOptions.agg_types.${type}` : '$ezreeport.unknown').toString(),
          field: this.metric[type || '']?.field || 'unknown',
        },
      };
    },
    totalMap(): Record<string, boolean | undefined> {
      return Object.fromEntries(
        this.totals.map((dK) => [dK, true]),
      );
    },
    valueColumn(): TableColumn | undefined {
      return this.columns.find(
        (c) => c.dataKey.split('.').at(-1) !== 'key',
      );
    },
  },
  watch: {
    metric() {
      this.$emit('input', this.regenColumnsDK());
    },
  },
  mounted() {
    if (this.columns.length <= 0) {
      this.$emit('input', this.regenColumnsDK());
    }
  },
  methods: {
    /**
     * Open dialog for creating a column
     */
    onCreateColumn(e: MouseEvent) {
      this.openColumnDialog(e);
    },
    /**
     * Triggered when a column is updated
     *
     * @param column The column
     */
    onCurrentColumnUpdated(column: TableColumn) {
      const index = this.value.findIndex((c) => c.dataKey === this.currentColumn?.dataKey);
      if (index < 0) {
        return;
      }

      const columns = [...this.value];
      columns.splice(index, 1, omit(column, '_'));
      this.$emit('input', columns);
      this.currentColumn = column;
    },
    /**
     * Triggered when a column total is updated
     *
     * @param value Should show total or not
     */
    onCurrentColumnTotalUpdated(value: boolean) {
      if (!this.currentColumn) {
        return;
      }

      const totalSet = new Set(this.totals);
      if (value) {
        totalSet.add(this.currentColumn.dataKey);
      } else {
        totalSet.delete(this.currentColumn.dataKey);
      }

      this.$emit('update:totals', [...totalSet]);
    },
    /**
     * Triggered when a column style is updated
     *
     * @param style The style data
     */
    onCurrentColumnStyleUpdated(value: PDFStyle | undefined) {
      if (!this.currentColumn) {
        return;
      }

      const styles = { ...this.colStyles };
      if (value) {
        styles[this.currentColumn.dataKey] = value;
      } else {
        delete styles[this.currentColumn.dataKey];
      }

      this.$emit('update:col-styles', styles);
    },
    /**
     * Delete a column
     *
     * @param column The column
     */
    deleteColumn(column: CustomTableColumn) {
      const index = this.value.findIndex((c) => c.dataKey === column.dataKey);
      if (index < 0) {
        return;
      }

      const columns = [...this.value];
      columns.splice(index, 1);

      const bucket = this.columnBucketMap.get(column.dataKey)?.bucket;
      if (bucket) {
        this.onBucketDeletion(bucket);
      }
      const bckts = this.buckets.filter(({ name }) => name !== bucket?.name);
      this.$emit('input', this.regenColumnsDK(bckts, columns));
    },
    /**
     * Prepares and show dialog
     *
     * @param e The event
     * @param column The column. If not provided it creates a new one
     */
    async openColumnDialog(e: MouseEvent, column?: TableColumn) {
      if (column) {
        this.currentColumn = column;
      } else {
        this.upsertBucket(
          { name: uuid().split('-')[0] },
        );
        await this.$nextTick();
        this.addColumn();
      }

      if (e) {
        const coords = { x: e.clientX, y: e.clientY };
        const target = (e.currentTarget as HTMLElement | undefined);
        if (target && column) {
          const bounding = target.getBoundingClientRect();

          // Adding close icon offset
          coords.x = bounding.x + 60;
          coords.y = bounding.y + (bounding.height / 2);
        }

        this.columnPopoverCoords = coords;
      }
      await this.$nextTick();
      this.columnPopoverShown = true;
    },
    upsertBucket(bucket: ElasticAgg) {
      const value: ElasticAgg = {
        name: uuid().split('-')[0],
        ...bucket,
      };

      const buckets = [...this.buckets];
      const index = buckets.findIndex(({ name }) => name === bucket.name);

      if (index < 0) {
        // Insert before value column
        buckets.push(value);
      } else {
        buckets.splice(index, 1, value);
      }
      this.$emit('update:buckets', buckets);
    },
    onBucketDeletion(bucket: ElasticAgg) {
      const buckets = [...this.buckets];
      const index = buckets.findIndex((b) => b.name === bucket.name);
      if (index >= 0) {
        buckets.splice(index, 1);
        this.$emit('update:buckets', buckets);
      }
    },
    addColumn() {
      const id = this.value.length;

      const dataKey = this.generateColumnDK();
      this.currentColumn = { dataKey, header: `Column ${id}` };
      const columns = [...this.columns];
      columns.splice(columns.length, 0, { ...this.currentColumn, _: { dragged: false } });
      this.$emit('input', this.regenColumnsDK(undefined, columns));
    },
    getBucketNameFromDK(dk: string) {
      // search for last bucket before suffix
      const regexRes = /\.?(?<bucketName>[^.]+)\.key$/i.exec(dk);
      if (!regexRes?.groups?.bucketName) {
        return this.buckets[0]?.name ?? undefined;
      }
      return regexRes.groups.bucketName;
    },
    generateColumnDK(index?: number, bckts?: ElasticAgg[]) {
      // Skipping first bucket as it's already the dataKey of the whole table
      const buckets = (bckts ?? this.buckets).slice(1, index && index + 1);
      const dataKey = [
        ...buckets.map((b) => b.name),
        'key',
      ].join('.');
      return dataKey;
    },
    generateValueDK(bckts?: ElasticAgg[]) {
      let field = 'doc_count';
      if (this.metricFormatted) {
        field = `${this.metricFormatted.formatted.name}.value`;
      }

      // Skipping first bucket as it's already the dataKey of the whole table
      const buckets = (bckts ?? this.buckets).slice(1);
      const dataKey = [
        ...buckets.map((b) => b.name),
        field,
      ].join('.');
      return dataKey;
    },
    regenColumnsDK(bckts?: ElasticAgg[], cols?: TableColumn[]) {
      const columns = [...(cols ?? this.columns)];
      const valueColumnIndex = columns.findIndex(
        (c) => c.dataKey === this.valueColumn?.dataKey,
      );

      let vC: TableColumn = { header: 'Value', dataKey: this.generateValueDK(bckts) };
      if (valueColumnIndex >= 0) {
        const [deletedColumn] = columns.splice(valueColumnIndex, 1);
        vC = {
          ...deletedColumn,
          dataKey: vC.dataKey,
        };
      }

      const res = columns.map((c, i) => ({ ...c, dataKey: this.generateColumnDK(i, bckts) }));
      return [
        ...res,
        vC,
      ].map((c) => omit(c, '_'));
    },
    /**
     * Allow drag of item when it's handle is clicked
     *
     * @param column The column allowed to be dragged
     */
    allowDrag(column: CustomTableColumn) {
      const index = this.columns.findIndex(
        ({ dataKey }) => dataKey === column.dataKey,
      );

      if (index >= 0 && !this.readonly) {
        const columns = [...this.columns];

        const col = columns[index];
        col._.dragged = true;
        columns.splice(index, 1, col);

        this.columns = columns;
        if (this.innerBuckets.length <= 0) {
          this.innerBuckets = [...this.buckets];
        }
      }
    },
    /**
     * Disallow drag of item when it's handle is no longer clicked
     *
     * @param column The column disallowed to be dragged
     */
    disallowDrag(column: CustomTableColumn) {
      const index = this.columns.findIndex(
        ({ dataKey }) => dataKey === column.dataKey,
      );

      if (index >= 0 && !this.readonly) {
        const columns = [...this.columns];

        const col = columns[index];
        col._.dragged = false;
        columns.splice(index, 1, col);

        this.columns = columns;
        if (this.innerBuckets.length <= 0) {
          this.innerBuckets = [...this.buckets];
        }
      }
    },
    /**
     * Init dragged data
     *
     * @param ev The event
     * @param column The dragged item
     * @param index The index of the dragged item
     */
    onDragStart(ev: DragEvent, column: CustomTableColumn, index: number) {
      const isLoading = this.loadingMap[column.dataKey];
      const isValueColumn = this.valueColumn?.dataKey === column.dataKey;
      if (!this.readonly && !isLoading && !isValueColumn) {
        // Init data
        this.draggedIndex = index;
        const img = new Image();
        ev.dataTransfer?.setDragImage(img, 0, 0);
        ev.dataTransfer?.setData(
          dragFormat,
          JSON.stringify({
            index,
            item: column,
          }),
        );
      }
    },
    /**
     * Update columns & inner dragged state
     */
    async onDragEnd() {
      if (!this.readonly && this.draggedIndex >= 0) {
        this.disallowDrag(this.columns[this.draggedIndex]);

        const columns = this.regenColumnsDK(this.innerBuckets);
        this.$emit('input', columns);
        this.$emit('update:buckets', this.innerBuckets);
        await this.$nextTick();
        this.columns = [];
        this.innerBuckets = [];
        this.draggedIndex = -1;
      }
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
     * Update columns state that current element is hovered
     *
     * @param ev The event
     * @param index The new index
     */
    onDragEnter(ev: DragEvent, newIndex: number) {
      const isFromHere = ev.dataTransfer?.types.includes(dragFormat);
      const isNotTheSame = newIndex !== this.draggedIndex;
      const isValueColumn = this.valueColumn?.dataKey === this.columns[newIndex]?.dataKey;

      if (!this.readonly && isNotTheSame && isFromHere && !isValueColumn) {
        // Move column
        const columns = [...this.columns];
        columns.splice(this.draggedIndex, 1);
        columns.splice(newIndex, 0, this.columns[this.draggedIndex]);
        this.columns = columns;

        // Move bucket as we move column
        const buckets = [...this.innerBuckets];
        buckets.splice(this.draggedIndex, 1);
        buckets.splice(newIndex, 0, this.buckets[this.draggedIndex]);
        this.innerBuckets = buckets;

        this.draggedIndex = newIndex;
      }
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

</style>

<i18n lang="yaml">
en:
  headers:
    total: 'Total'
fr:
  headers:
    total: 'Total'
</i18n>
