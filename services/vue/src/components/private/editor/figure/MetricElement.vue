<template>
  <v-list-item
    :title="modelValue.text"
    rounded
  >
    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>

    <template #subtitle>
      <EditorAggregationSubtitle :model-value="modelValue.aggregation" :name="modelValue.text" />
    </template>

    <template #append>
      <v-icon
        v-if="formatIcon"
        :icon="formatIcon"
        start
      />

      <template v-if="!readonly">
        <v-btn
          v-tooltip:top="$t('$ezreeport.edit')"
          icon="mdi-pencil"
          color="blue"
          variant="text"
          density="comfortable"
          class="mr-2 ml-8"
        />

        <v-btn
          v-tooltip:top="$t('$ezreeport.delete')"
          icon="mdi-delete"
          color="red"
          variant="text"
          density="comfortable"
          class="mr-2"
          @click="$emit('click:close', $event)"
        />
      </template>
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import type { MetricLabel } from '~sdk/helpers/figures';

// Components props
const props = defineProps<{
  /** Label to display */
  modelValue: MetricLabel,
  /** Is the element readonly */
  readonly?: boolean,
}>();

// Components events
defineEmits<{
  /** Click on the close button */
  (event: 'click:close', value: MouseEvent): void
}>();

/** The icon to display based on format */
const formatIcon = computed(
  () => (props.modelValue.format && formatIcons.get(props.modelValue.format.type)) || undefined,
);
</script>
