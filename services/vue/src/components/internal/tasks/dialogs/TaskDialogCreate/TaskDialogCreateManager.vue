<template>
  <TaskDialogAdvancedCreate
    v-if="isAdvancedShown"
    :value="value"
    ref="dialog"
    @input="emit('input', $event)"
    @created="emit('created', $event)"
  >
    <template #toolbar>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <v-btn
            fab
            small
            elevation="0"
            color="warning"
            class="mr-1"
            v-bind="attrs"
            @click="isAdvancedShown = false"
            v-on="on"
          >
            <v-icon>mdi-hammer-wrench</v-icon>
          </v-btn>
        </template>

        {{ $t('advanced') }}
      </v-tooltip>
    </template>
  </TaskDialogAdvancedCreate>

  <TaskDialogSimpleCreate
    v-else
    :value="value"
    :namespace="namespace"
    ref="dialog"
    @input="emit('input', $event)"
    @created="emit('created', $event)"
  >
    <template #toolbar>
      <v-tooltip top>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            class="mr-1"
            v-bind="attrs"
            @click="isAdvancedShown = true"
            v-on="on"
          >
            <v-icon>mdi-hammer-wrench</v-icon>
          </v-btn>
        </template>

        {{ $t('advanced') }}
      </v-tooltip>
    </template>
  </TaskDialogSimpleCreate>
</template>

<script setup lang="ts">
import type { tasks } from '@ezpaarse-project/ezreeport-sdk-js';
import {
  ref,
  watch,
} from 'vue';

const props = defineProps<{
  value: boolean;
  namespace?: string;
}>();

const emit = defineEmits<{
  (e: 'input', value: boolean): void;
  (e: 'created', value: tasks.FullTask): void;
}>();

const isAdvancedShown = ref(false);

watch(
  () => props.value,
  (value) => {
    if (!value) {
      isAdvancedShown.value = false;
    }
  },
);
</script>

<i18n lang="yaml">
en:
  advanced: 'Advanced mode'
fr:
  advanced: 'Mode avancé'
</i18n>
