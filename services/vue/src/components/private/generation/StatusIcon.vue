<template>
  <v-icon v-tooltip="tooltip" v-bind="iconProps" />
</template>

<script setup lang="ts">
  import type { Generation } from '~sdk/generations';
  import {
    mdiAlertOctagon,
    mdiCheck,
    mdiClock,
    mdiClose,
    mdiHelp,
    mdiPlay,
  } from '@mdi/js';

  const props = defineProps<{
    modelValue: Generation;
  }>();

  const { t } = useI18n();

  const tooltip = computed(() =>
    t(`$ezreeport.generations.statusList.${props.modelValue.status}`)
  );

  const iconProps = computed(() => {
    switch (props.modelValue.status) {
      case 'SUCCESS':
        return { color: 'success', icon: mdiCheck };
      case 'ERROR':
        return { color: 'error', icon: mdiClose };
      case 'PROCESSING':
        return { color: 'primary', icon: mdiPlay };
      case 'PENDING':
        return { color: 'secondary', icon: mdiClock };
      case 'ABORTED':
        return { color: 'error', icon: mdiAlertOctagon };
      default:
        return { color: 'grey', icon: mdiHelp };
    }
  });
</script>
