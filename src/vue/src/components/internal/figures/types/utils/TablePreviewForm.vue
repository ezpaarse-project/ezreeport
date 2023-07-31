<template>
  <v-simple-table dense>
    <TableColumnDialog
      v-if="currentColumn && columnDialogShown"
      v-model="columnDialogShown"
      :column="currentColumn"
      :total="totalMap[currentColumn.dataKey]"
      :colStyle="colStyles[currentColumn.dataKey]"
      :key-prefix="keyPrefix"
      :current-data-keys="currentDataKeys"
      :readonly="readonly"
      @update:column="onCurrentColumnUpdated"
      @update:total="onCurrentColumnTotalUpdated"
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
              v-if="!readonly"
              x-small
              class="mr-1"
              style="cursor: grab;"
              @mousedown="allowDrag(column)"
              @mouseup="disallowDrag(column)"
            >
              mdi-drag-vertical-variant
            </v-icon>

            {{ column.header }}

            <v-btn
              v-if="!readonly"
              icon
              x-small
              class="ml-1"
              color="error"
              @click="onColumnDeleted(column)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>

            <v-btn
              icon
              x-small
              @click="openColumnDialog(column)"
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
          <i v-if="keyPrefix">{{ keyPrefix }}</i>
          <span>{{ dataKey }}</span>
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
import { omit } from 'lodash';
import { defineComponent, type PropType } from 'vue';
import type { PDFStyle, TableColumn } from './table';

const dragFormat = 'custom/figure-table-json';

type CustomTableColumn = TableColumn & {
  _: {
    dragged: boolean,
  },
};

const columnDefaults = ['key', 'doc_count'];

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
    dataKey: {
      type: String,
      default: '',
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
  },
  data: () => ({
    columnDialogShown: false,

    innerColumns: [] as CustomTableColumn[],
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
    totalMap(): Record<string, boolean | undefined> {
      return this.totals.reduce(
        (prev, dK) => ({
          ...prev,
          [dK]: true,
        }),
        {},
      );
    },
    currentDataKeys() {
      return this.value.map(({ dataKey }) => dataKey);
    },
    keyPrefix() {
      return `${this.dataKey}[].`;
    },
  },
  methods: {
    /**
     * Open dialog for creating a column
     */
    createColumn() {
      this.openColumnDialog();
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
     * Triggered when a column is deleted
     *
     * @param column The column
     */
    onColumnDeleted(column: TableColumn) {
      const index = this.value.findIndex((c) => c.dataKey === column.dataKey);
      if (index < 0) {
        return;
      }

      const columns = [...this.value];
      columns.splice(index, 1);
      this.$emit('input', columns);
    },
    /**
     * Prepares and show dialog
     *
     * @param e The event
     * @param column The column. If not provided it creates a new one
     */
    async openColumnDialog(column?: TableColumn) {
      if (column) {
        this.currentColumn = column;
      } else {
        const id = this.value.length;
        this.currentColumn = { dataKey: columnDefaults[id] || `agg${id}`, header: `Column ${id}` };
        this.$emit('input', [...this.value, this.currentColumn]);
      }

      await this.$nextTick();
      this.columnDialogShown = true;
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
        columns.splice(index, 1, { ...column, _: { ...column._, dragged: true } });
        this.columns = columns;
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
        columns.splice(index, 1, { ...column, _: { ...column._, dragged: false } });
        this.columns = columns;
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
      if (!this.readonly) {
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

        const columns = this.columns.map((c) => omit(c, '_'));
        this.$emit('input', columns);
        await this.$nextTick();
        this.columns = [];
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
      if (
        !this.readonly
        && newIndex !== this.draggedIndex
        && ev.dataTransfer?.types.includes(dragFormat)
      ) {
        const columns = [...this.columns];
        columns.splice(this.draggedIndex, 1);
        columns.splice(newIndex, 0, this.columns[this.draggedIndex]);
        this.columns = columns;

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
