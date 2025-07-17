<template>
  <v-list-item
    :title="label"
    :subtitle="versions"
    :class="{ 'text-red': modelValue.length <= 0 }"
  >
    <template #append>
      <v-badge
        v-tooltip:left="{ text: tooltip, disabled: !tooltip }"
        :model-value="modelValue.length > 1"
        :content="modelValue.length"
        color="success"
      >
        <v-chip
          :color="modelValue.length > 0 ? 'success' : 'error'"
          :text="modelValue.length > 0 ? `OK` : `KO`"
          size="small"
        />
      </v-badge>
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import type { ApiService } from '~sdk/health';

const props = defineProps<{
  modelValue: ApiService[],
  label: string,
}>();

// oxlint-disable-next-line id-length
const { t } = useI18n();

const versions = computed(() => Array.from(
  new Set(props.modelValue.map(({ version }) => version)),
).join(' | '));

const tooltip = computed(() => {
  if (props.modelValue.length === 0) {
    return t('$ezreeport.health.ko');
  }
  if (props.modelValue.length === 1) {
    return;
  }
  return t('$ezreeport.health.instances', props.modelValue.length);
});
</script>
