<template>
  <v-row v-if="task">
    <v-col>
      {{ $t('') }}
    </v-col>

    <v-divider vertical />

    <v-col cols="6">
      <pre>
{{ JSON.stringify(task.template, undefined, 2) }}
                </pre>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import type { tasks } from 'ezreeport-sdk-js';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  props: {
    task: {
      type: Object as PropType<tasks.FullTask | undefined>,
      default: undefined,
    },
  },
});
</script>

<style scoped>

</style>
