<template>
  <v-list-item
    :title="modelValue.name"
    :subtitle="$t('$ezreeport.health.fsUsage', { available, used, total })">
    <template #append>
      <v-progress-circular
        v-tooltip:left="$t('$ezreeport.health.fsUsage%', { value: percentage.toFixed(2) })"
        :model-value="percentage"
        color="primary"
      />
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import prettyBytes from 'pretty-bytes';
import type { FileSystemUsage } from '~sdk/health';

const props = defineProps<{
  modelValue: FileSystemUsage,
}>();

const available = computed(() => prettyBytes(props.modelValue.available));
const used = computed(() => prettyBytes(props.modelValue.used));
const total = computed(() => prettyBytes(props.modelValue.total));
const percentage = computed(() => (props.modelValue.used / props.modelValue.total) * 100);
</script>
