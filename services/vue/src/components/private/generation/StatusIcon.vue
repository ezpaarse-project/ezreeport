<template>
  <v-icon v-tooltip="tooltip" v-bind="iconProps" />
</template>

<script setup lang="ts">
import type { Generation } from '~sdk/generations';

const props = defineProps<{
  modelValue: Generation,
}>();

const { t } = useI18n();

const tooltip = computed(() => t(`$ezreeport.generations.statusList.${props.modelValue.status}`));

const iconProps = computed(() => {
  switch (props.modelValue.status) {
    case 'SUCCESS':
      return { icon: 'mdi-check', color: 'success' };
    case 'ERROR':
      return { icon: 'mdi-close', color: 'error' };
    case 'PROCESSING':
      return { icon: 'mdi-play', color: 'primary' };
    case 'PENDING':
      return { icon: 'mdi-clock', color: 'secondary' };
    case 'ABORTED':
      return { icon: 'mdi-alert-octagon', color: 'error' };
    default:
      return { icon: 'mdi-help', color: 'grey' };
  }
});
</script>
