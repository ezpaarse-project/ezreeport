<template>
  <v-card
    :title="$t('$ezreeport.editor.figures.metric.title')"
    :prepend-icon="cardIcon"
  >
    <template #append>
      <v-alert
        v-if="readonly"
        :title="$t('$ezreeport.readonly')"
        icon="mdi-lock"
        density="compact"
        class="mr-2"
      />

      <slot name="append" />
    </template>

    <template #text>
      <v-row>
        <v-col>
          <EditorFilterList
            :model-value="modelValue.filters"
            :readonly="readonly"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-card
            :title="
              $t(
                '$ezreeport.editor.figures.metric.elements.title',
                modelValue.params.labels.length
              )
            "
            prepend-icon="mdi-format-list-bulleted"
            variant="outlined"
          >
            <template v-if="!readonly" #append>
              <v-btn
                v-tooltip:top="$t('$ezreeport.new')"
                icon="mdi-plus"
                color="green"
                density="compact"
                variant="text"
                class="ml-2"
                @click="openLabelForm()"
              />
            </template>

            <template v-if="modelValue.params.labels.length > 0" #text>
              <v-list ref="elementListRef" lines="two">
                <EditorFigureMetricElement
                  v-for="element in modelValue.params.labels"
                  :key="getMetricLabelKey(element)"
                  :model-value="element"
                  :readonly="readonly"
                  class="metric--element"
                  @click="openLabelForm(element)"
                  @click:close="removeLabel(element)"
                >
                  <template v-if="!readonly" #prepend>
                    <v-icon
                      icon="mdi-drag-horizontal"
                      class="metric--element-handle"
                      style="cursor: grab"
                      @click.stop=""
                    />
                  </template>
                </EditorFigureMetricElement>
              </v-list>
            </template>
          </v-card>
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
      width="50%"
      @update:model-value="$event || closeLabelForm()"
    >
      <EditorFigureMetricElementForm
        :model-value="updatedLabel"
        :headers="headers"
        @update:model-value="setLabel($event)"
      >
        <template #actions>
          <v-btn :text="$t('$ezreeport.cancel')" @click="closeLabelForm()" />
        </template>
      </EditorFigureMetricElementForm>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { dragAndDrop } from '@formkit/drag-and-drop/vue';

import {
  getMetricLabelKey,
  getAllMetricLabelKeysOfHelper,
  removeMetricLabelOfHelper,
  updateMetricLabelOfHelper,
  addMetricLabelOfHelper,
  type MetricFigureHelper,
  type MetricLabel,
} from '~sdk/helpers/figures';

// Components props
const props = defineProps<{
  /** The metric figure to edit */
  modelValue: MetricFigureHelper;
  /** Should be readonly */
  readonly?: boolean;
}>();

// Components events
const emit = defineEmits<{
  /** Updated figure */
  (event: 'update:modelValue', value: MetricFigureHelper): void;
}>();

// Utils composables
// oxlint-disable-next-line id-length
const { t } = useI18n();

/** Should show the label form */
const isFormVisible = ref(false);
/** The label to edit */
const updatedLabel = ref<MetricLabel | undefined>();

/** The element list ref to DOM */
const elementListRef = useTemplateRef<HTMLElement>('elementListRef');

// Make the elements draggable to sort
if (!props.readonly) {
  dragAndDrop({
    parent: elementListRef as Ref<HTMLElement>,
    dragHandle: '.metric--element-handle',
    dragPlaceholderClass: 'metric--element--dragging',
    dropZone: false,
    dragImage: () => document.createElement('div'), // Disable drag image
    values: computed({
      get: () => props.modelValue.params.labels,
      set: (value) => {
        const { params } = props.modelValue;
        params.labels = value;
        emit('update:modelValue', props.modelValue);
      },
    }),
  });
}

/** Icon of the card */
const cardIcon = figureIcons.get('metric');
/** Set of headers */
const headers = computed(
  () => new Set(getAllMetricLabelKeysOfHelper(props.modelValue))
);

/**
 * Close the label form
 */
function closeLabelForm() {
  isFormVisible.value = false;
}

/**
 * Open the label form
 *
 * @param label The label to edit
 */
function openLabelForm(label?: MetricLabel) {
  updatedLabel.value = label;
  isFormVisible.value = true;
}

/**
 * Remove a label
 *
 * @param label The label to remove
 */
function removeLabel(label: MetricLabel) {
  try {
    removeMetricLabelOfHelper(props.modelValue, label);
    emit('update:modelValue', props.modelValue);
  } catch (err) {
    handleEzrError(
      t('$ezreeport.editor.figures.metric.elements.errors.delete'),
      err
    );
  }
}

/**
 * Upsert the label
 *
 * @param label The label
 */
function setLabel(label: MetricLabel) {
  try {
    if (updatedLabel.value) {
      updateMetricLabelOfHelper(props.modelValue, updatedLabel.value, label);
    } else {
      addMetricLabelOfHelper(props.modelValue, label);
    }

    emit('update:modelValue', props.modelValue);
    closeLabelForm();
  } catch (err) {
    handleEzrError(
      t('$ezreeport.editor.figures.metric.elements.errors.edit'),
      err
    );
  }
}
</script>

<style scoped>
.metric--element {
  transition:
    transform 0.1s ease-in-out,
    box-shadow 0.1s ease-in-out;
}

.metric--element--dragging {
  background-color: white;
  border-radius: 8px;
  box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.2);
  transform: scale(0.9) translateX(-5%);
}
</style>
