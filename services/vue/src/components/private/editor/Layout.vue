<template>
  <v-fade-transition tag="v-row" group class="template-layout-elements">
    <EditorSlot
      v-for="(element, index) in elements"
      :key="element.id"
      :model-value="element.figure"
      :readonly="readonly"
      :default-slot="element.slot"
      :unused-slots="unusedSlots"
      @update:model-value="editFigure($event, element)"
    >
      <template #append>
        <span style="font-size: 1.5em; opacity: 0.5;">
          {{ index + 1 }}
        </span>
      </template>

      <template v-if="!readonly" #text>
        <v-row>
          <v-col class="d-flex justify-end">
            <v-btn
              :text="$t('$ezreeport.delete')"
              append-icon="mdi-delete"
              color="red"
              density="comfortable"
              class="ml-2"
              @click="deleteFigure(element)"
            />
          </v-col>
        </v-row>
      </template>
    </EditorSlot>
  </v-fade-transition>
</template>

<script setup lang="ts">
import {
  addFigureOfHelper,
  updateFigureOfHelper,
  removeFigureOfHelper,
  type AnyLayoutHelper,
} from '~sdk/helpers/layouts';
import type { AnyFigureHelper } from '~sdk/helpers/figures';

type Element = {
  id: string,
  figure?: AnyFigureHelper,
  slot: number,
};

// Components props
const props = defineProps<{
  /** The layout to edit */
  modelValue: AnyLayoutHelper,
  /** Should be readonly */
  readonly?: boolean,
}>();

// Components events
const emit = defineEmits<{
  /** Updated layout */
  (e: 'update:modelValue', value: AnyLayoutHelper): void
}>();

// Utils composables
const { grid } = useTemplateEditor();
const { t } = useI18n();

const unusedSlots = computed(() => {
  const possibleSlots = Array.from(
    { length: grid.value.cols * grid.value.rows },
    (_, i) => i,
  );
  const usedSlots = new Set(props.modelValue.figures.map((f) => [...f.slots]).flat());
  return possibleSlots.filter((s) => !usedSlots.has(s));
});

const elements = computed((): Element[] => {
  const elementList = props.modelValue.figures.map((figure) => ({
    id: figure.id,
    figure,
    slot: Math.min(...figure.slots, unusedSlots.value.at(0) ?? 0),
  }));

  // If no unusedElement slots, return
  if (unusedSlots.value.length <= 0) {
    return elementList;
  }

  // Add empty slots
  return [
    ...elementList,
    ...unusedSlots.value.map((slot) => ({
      id: `empty-${slot}`,
      figure: undefined,
      slot,
    })),
  ];
});

/**
 *
 */
function editFigure(figure: AnyFigureHelper, element: Element) {
  try {
    if (element.figure) {
      updateFigureOfHelper(props.modelValue, element.figure, figure);
    } else {
      addFigureOfHelper(props.modelValue, figure);
    }
    emit('update:modelValue', props.modelValue);
  } catch (e) {
    handleEzrError(t('$ezreeport.editor.layouts.errors.edit'), e);
  }
}

function deleteFigure(element: Element) {
  try {
    if (element.figure) {
      removeFigureOfHelper(props.modelValue, element.figure);
    }
    emit('update:modelValue', props.modelValue);
  } catch (e) {
    handleEzrError(t('$ezreeport.editor.layouts.errors.delete'), e);
  }
}
</script>

<style lang="scss" scoped>
.template-layout-elements {
  display: grid;
  grid-template-columns: repeat(v-bind('grid.cols'), 1fr);
  grid-template-rows: repeat(v-bind('grid.rows'), 1fr);
  height: 100%;
}
</style>
