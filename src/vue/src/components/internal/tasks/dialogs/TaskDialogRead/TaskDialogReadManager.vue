<template>
  <TaskDialogAdvancedRead
    v-if="isAdvancedShown"
    :value="value"
    :id="taskId"
    @input="emit('input', $event)"
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
  </TaskDialogAdvancedRead>

  <TaskDialogSimpleRead
    v-else
    :value="value"
    :id="taskId"
    :namespace="namespace"
    @input="emit('input', $event)"
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
  </TaskDialogSimpleRead>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
} from 'vue';

const props = defineProps<{
  value: boolean;
  taskId: string;
  namespace?: string;
}>();

const emit = defineEmits<{
  (e: 'input', value: boolean): void;
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
