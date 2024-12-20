<template>
  <v-col class="template-layout-slot">
    <v-card
      v-if="modelValue"
      :title="title"
      variant="outlined"
      class="template-layout-slot--figure"
    >
      <!-- TODO: -->
      <!-- <template #prepend>
        <v-icon icon="mdi-drag" class="template-layout-slot--figure-drag" />
      </template> -->

      <template #append>
        <slot name="append" />

        <v-btn
          :text="$t('$ezreeport.settings')"
          append-icon="mdi-cog"
          color="primary"
          density="comfortable"
          class="ml-2"
          @click="isFormVisible = true"
        />
      </template>

      <template #text>
        <v-row>
          <v-col>
            <v-autocomplete
              :model-value="modelValue.type"
              :label="$t('$ezreeport.editor.figures._.type')"
              :prepend-icon="typeIcon"
              :items="typeOptions"
              :readonly="readonly"
              variant="underlined"
              hide-details
              @update:model-value="onTypeChange($event)"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-select
              v-model="slots"
              :label="$t('$ezreeport.editor.figures._.slots')"
              :items="slotsOptions"
              :readonly="readonly"
              prepend-icon="mdi-grid-large"
              variant="underlined"
              hide-details
              multiple
            />
          </v-col>
        </v-row>

        <slot name="text" />
      </template>

      <v-dialog v-model="isFormVisible" width="75%" scrollable>
        <EditorFigureMd
          v-if="isFigureHelperMarkdown(modelValue)"
          :model-value="modelValue"
          @update:modelValue="emit('update:modelValue', $event)"
        >
          <template #append>
            <v-btn icon="mdi-close" variant="text" density="comfortable" @click="isFormVisible = false" />
          </template>
          <template #actions>
            <v-btn :text="$t('$ezreeport.save')" append-icon="mdi-content-save" color="primary" @click="isFormVisible = false" />
          </template>
        </EditorFigureMd>

        <EditorFigureMetric
          v-else-if="isFigureHelperMetric(modelValue)"
          :model-value="modelValue"
          @update:modelValue="emit('update:modelValue', $event)"
        >
          <template #append>
            <v-btn icon="mdi-close" variant="text" density="comfortable" @click="isFormVisible = false" />
          </template>
          <template #actions>
            <v-btn :text="$t('$ezreeport.save')" append-icon="mdi-content-save" color="primary" @click="isFormVisible = false" />
          </template>
        </EditorFigureMetric>

        <EditorFigureTable
          v-else-if="isFigureHelperTable(modelValue)"
          :model-value="modelValue"
          @update:modelValue="emit('update:modelValue', $event)"
        >
          <template #append>
            <v-btn icon="mdi-close" variant="text" density="comfortable" @click="isFormVisible = false" />
          </template>
          <template #actions>
            <v-btn :text="$t('$ezreeport.save')" append-icon="mdi-content-save" color="primary" @click="isFormVisible = false" />
          </template>
        </EditorFigureTable>

        <EditorFigureVega
          v-else
          :model-value="modelValue"
          @update:modelValue="emit('update:modelValue', $event)"
        >
          <template #append>
            <v-btn icon="mdi-close" variant="text" density="comfortable" @click="isFormVisible = false" />
          </template>
          <template #actions>
            <v-btn :text="$t('$ezreeport.save')" append-icon="mdi-content-save" color="primary" @click="isFormVisible = false" />
          </template>
        </EditorFigureVega>
      </v-dialog>
    </v-card>
    <v-card
      v-else
      variant="outlined"
      color="grey"
      class="template-layout-slot--empty"
      @click="addFigure()"
    >
      <v-icon icon="mdi-plus" color="green" style="font-size: 3rem;" />
      <div>{{ $t('$ezreeport.editor.figures._.create') }}</div>
    </v-card>
  </v-col>
</template>

<script setup lang="ts">
import { figureToGridPosition } from '~/lib/layouts';

import {
  isFigureHelperMarkdown,
  isFigureHelperMetric,
  isFigureHelperTable,
  createFigureHelper,
  createMdFigureHelper,
  type AnyFigureHelper,
} from '~sdk/helpers/figures';

const SLOT_ICONS = new Map([
  [0, 'mdi-pan-top-left'],
  [1, 'mdi-pan-top-right'],
  [2, 'mdi-pan-bottom-left'],
  [3, 'mdi-pan-bottom-right'],
]);

// Components props
const props = defineProps<{
  /** The figure to edit */
  modelValue: AnyFigureHelper | undefined,
  /** Should be readonly */
  readonly?: boolean,
  /** Default slot of figure */
  defaultSlot?: number,
  /** Unused slots */
  unusedSlots?: number[],
}>();

// Components events
const emit = defineEmits<{
  /** Updated figure */
  (e: 'update:modelValue', value: AnyFigureHelper): void
}>();

// Utils composables
const { t } = useI18n();
const { grid } = useTemplateEditor();

/** Backups of previous figure types */
const figureBackups = ref<Map<string, AnyFigureHelper>>(new Map());
/** Should show edit dialog */
const isFormVisible = ref(false);

/** The figure title */
const title = computed(() => {
  if (props.modelValue && 'title' in props.modelValue.params) {
    return props.modelValue.params.title;
  }
  return undefined;
});
/** The figure slot */
const slots = computed({
  get: () => Array.from(props.modelValue?.slots ?? []),
  set: (value) => {
    if (!props.modelValue) {
      return;
    }
    const spec = props.modelValue;
    spec.slots = new Set(value);
    emit('update:modelValue', spec);
  },
});
/** Icon for current type */
const typeIcon = computed(
  () => (props.modelValue ? figureIcons.get(props.modelValue.type) : undefined),
);
/** Types options */
const typeOptions = computed(() => Array.from(figureIcons.keys()).map((figureType) => ({
  value: figureType,
  title: t(`$ezreeport.editor.figures._.types.${figureType}`),
  props: {
    appendIcon: figureIcons.get(figureType),
  },
})));
/** Slots options */
const slotsOptions = computed(
  () => {
    const length = grid.value.cols * grid.value.rows;
    return Array.from({ length }, (_, i) => i).map((slot) => ({
      value: slot,
      title: length === SLOT_ICONS.size ? t(`$ezreeport.editor.figures._.slotsList.${slot}`) : slot,
      props: {
        appendIcon: length === SLOT_ICONS.size ? SLOT_ICONS.get(slot) : undefined,
        // Unused slots provided AND current slot is used
        // AND current slot is not used by current figure, unless it's the only one
        disabled: props.unusedSlots && !props.unusedSlots.includes(slot)
          && (!props.modelValue?.slots.has(slot) || props.modelValue.slots.size === 1),
      },
    }));
  },
);
/** Position in CSS grid */
const gridPosition = computed(() => figureToGridPosition(
  props.modelValue,
  props.defaultSlot ?? 0,
  grid.value,
));

/**
 * Update figure type
 *
 * @param type
 */
function onTypeChange(type: string) {
  if (!props.modelValue) {
    return;
  }

  // Backup current params for current type
  figureBackups.value.set(props.modelValue.type, props.modelValue);

  // Get params for new type or create a new figure
  let figure = figureBackups.value.get(type);
  if (!figure) {
    figure = createFigureHelper(type);
    // Ensuring id don't change, avoiding useless re-render
    Object.assign(figure, { id: props.modelValue.id });
  }

  // Reapply new filters
  if ('filters' in figure.params && 'filters' in props.modelValue.params) {
    figure.params.filters = props.modelValue.params.filters;
  }

  // Reapply new order
  if ('order' in figure.params && 'order' in props.modelValue.params) {
    figure.params.order = props.modelValue.params.order;
  }

  // Reapply new slots
  figure.slots = props.modelValue.slots;

  emit('update:modelValue', figure);
}

/**
 * Create a new figure
 */
function addFigure() {
  emit('update:modelValue', createMdFigureHelper(undefined, [props.defaultSlot ?? 0]));
}
</script>

<style lang="scss" scoped>
.template-layout-slot {
  &,
  &--empty,
  &--figure {
    height: 100%;
  }

  grid-column: v-bind('gridPosition.start.col + 1') / v-bind('gridPosition.end.col + 2');
  grid-row: v-bind('gridPosition.start.row + 1') / v-bind('gridPosition.end.row + 2');

  &--empty {
    position: relative;
    border-style: dashed;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}
</style>
