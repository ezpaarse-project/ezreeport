<template>
  <v-card
    :title="$t('$ezreeport.editor.figures.table.title')"
    :prepend-icon="cardIcon"
  >
    <template #append>
      <slot name="append" />
    </template>

    <template #text>
      <v-row>
        <v-col>
          <EditorFigureTitleField v-model="title" :readonly="readonly" />
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <EditorFilterList :model-value="modelValue.filters" :readonly="readonly" />
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-card
            :title="$t('$ezreeport.editor.figures.table.columns.title', modelValue.params.columns.length)"
            variant="outlined"
            prepend-icon="mdi-table-column"
          >
            <template v-if="!readonly" #append>
              <v-btn
                v-tooltip:top="$t('$ezreeport.new')"
                icon="mdi-plus"
                color="green"
                density="compact"
                variant="text"
                class="ml-2"
                @click="openColumnForm()"
              />
            </template>

            <template v-if="modelValue.params.columns.length > 0" #text>
              <v-row ref="columnListRef" class="table-preview">
                <v-col
                  v-for="column in modelValue.params.columns"
                  :key="getTableColumnKey(column)"
                  cols="2"
                  class="table-preview--column"
                >
                  <EditorFigureTableColumn :model-value="column">
                    <template v-if="!readonly" #prepend>
                      <v-icon
                        icon="mdi-drag-vertical"
                        class="mr-1 table-preview--column-handle"
                        style="cursor: grab;"
                      />
                    </template>

                    <template v-if="!readonly" #actions>
                      <v-btn
                        v-tooltip:top="$t('$ezreeport.edit')"
                        icon="mdi-pencil"
                        color="blue"
                        density="compact"
                        variant="text"
                        size="small"
                        class="ml-2"
                        @click="openColumnForm(column)"
                      />
                      <v-btn
                        v-tooltip:top="$t('$ezreeport.delete')"
                        icon="mdi-delete"
                        color="red"
                        density="compact"
                        variant="text"
                        size="small"
                        class="ml-2"
                        @click="removeColumn(column)"
                      />
                    </template>
                  </EditorFigureTableColumn>
                </v-col>
              </v-row>
            </template>

            <template v-else #text>
              <span class="text-error">{{ $t('$ezreeport.editor.figures.table.columns.empty') }}</span>
            </template>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <EditorAggregationOrder v-model="order" :readonly="readonly" />
        </v-col>

        <v-col>
          <v-switch
            v-model="showTotal"
            :label="$t('$ezreeport.editor.figures.table.showTotal')"
            :disabled="readonly || !hasMetric"
            prepend-icon="mdi-sigma"
            color="primary"
            hide-details
          />
        </v-col>
      </v-row>
    </template>

    <template v-if="$slots.actions" #actions>
      <v-spacer />

      <slot name="actions" />
    </template>

    <v-dialog
      v-if="!readonly"
      :model-value="isFormVisible"
      :scrim="false"
      width="50%"
      @update:model-value="$event || closeColumnForm()"
    >
      <EditorFigureTableColumnForm
        :model-value="updatedColumn"
        :headers="headers"
        :has-already-metric="hasMetric"
        @update:model-value="setColumn($event)"
      >
        <template #actions>
          <v-btn :text="$t('$ezreeport.cancel')" @click="closeColumnForm()" />
        </template>
      </EditorFigureTableColumnForm>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { dragAndDrop } from '@formkit/drag-and-drop/vue';

import {
  getTableColumnKey,
  getAllTableColumnKeysOfHelper,
  removeTableColumnOfHelper,
  updateTableColumnOfHelper,
  addTableColumnOfHelper,
  type TableFigureHelper,
  type TableColumn,
  type FigureOrder,
} from '~sdk/helpers/figures';

// Components props
const props = defineProps<{
  /** The table figure to edit */
  modelValue: TableFigureHelper,
  /** Should be readonly */
  readonly?: boolean,
}>();

// Components events
const emit = defineEmits<{
  /** Updated figure */
  (e: 'update:modelValue', value: TableFigureHelper): void
}>();

// Utils composables
const { t } = useI18n();

/** Should show the column form */
const isFormVisible = ref(false);
/** The column to edit */
const updatedColumn = ref<TableColumn | undefined>();

/** The column list ref to DOM */
const columnListRef = useTemplateRef<HTMLElement>('columnListRef');

// Make the columns draggable to sort
if (!props.readonly) {
  dragAndDrop({
    parent: columnListRef as Ref<HTMLElement>,
    dragHandle: '.table-preview--column-handle',
    dragPlaceholderClass: 'table-preview--column--dragging',
    dropZone: false,
    dragImage: () => document.createElement('div'), // Disable drag image
    values: computed({
      get: () => props.modelValue.params.columns,
      set: (value) => {
        const { params } = props.modelValue;
        params.columns = value;
        emit('update:modelValue', props.modelValue);
      },
    }),
  });
}

/** Icon of the card */
const cardIcon = figureIcons.get('table');
/** The figure order */
const order = computed<FigureOrder | undefined>({
  get: () => props.modelValue.params.order,
  set: (value) => {
    const { params } = props.modelValue;
    params.order = value;
    emit('update:modelValue', props.modelValue);
  },
});
/** The figure title */
const title = computed<string>({
  get: () => props.modelValue.params.title,
  set: (value) => {
    const { params } = props.modelValue;
    params.title = value;
    emit('update:modelValue', props.modelValue);
  },
});
/** If we should show the total of the metric columns */
const showTotal = computed({
  get: () => props.modelValue.params.total ?? false,
  set: (value) => {
    const { params } = props.modelValue;
    params.total = value;
    emit('update:modelValue', props.modelValue);
  },
});
/** Is the table already have a metric */
const hasMetric = computed(() => props.modelValue.params.columns.some((column) => !!column.metric));
/** Set of headers */
const headers = computed(() => new Set(getAllTableColumnKeysOfHelper(props.modelValue)));

/**
 * Close the column form
 */
function closeColumnForm() {
  isFormVisible.value = false;
}

/**
 * Open the column form
 *
 * @param column The column to edit
 */
function openColumnForm(column?: TableColumn) {
  updatedColumn.value = column;
  isFormVisible.value = true;
}

/**
 * Remove a column
 *
 * @param column The column to remove
 */
function removeColumn(column: TableColumn) {
  try {
    removeTableColumnOfHelper(props.modelValue, column);
    emit('update:modelValue', props.modelValue);
  } catch (e) {
    handleEzrError(t('$ezreeport.editor.figures.table.columns.errors.delete'), e);
  }
}

/**
 * Upsert the column
 *
 * @param column The column
 */
function setColumn(column: TableColumn) {
  try {
    if (updatedColumn.value) {
      updateTableColumnOfHelper(props.modelValue, updatedColumn.value, column);
    } else {
      addTableColumnOfHelper(props.modelValue, column);
    }

    emit('update:modelValue', props.modelValue);
    closeColumnForm();
  } catch (e) {
    handleEzrError(t('$ezreeport.editor.figures.table.columns.errors.edit'), e);
  }
}
</script>

<style lang="scss" scoped>
$border: 1px solid rgba(0, 0, 0, 0.1);

.table-preview {
  flex-wrap: nowrap;
  overflow-x: auto;

  padding: 0.5em 1em;

  &--column {
    padding: 0;
    flex: 1;
    min-width: 16rem;
    max-width: unset;
    transition: transform 0.1s ease-in-out, box-shadow 0.1s ease-in-out;

    &:not(:last-child) {
      border-right: $border;
    }

    :deep(.table-preview--column-header) {
      border-bottom: $border;
      padding: 12px;
    }

    :deep(.table-preview--column-value) {
      padding: 12px;
    }

    &--dragging {
      background-color: white;
      border-radius: 8px;
      box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.2);
      transform: scale(0.9);
    }
  }
}
</style>
