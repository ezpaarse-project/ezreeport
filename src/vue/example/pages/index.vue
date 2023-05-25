<template>
  <v-row>
    <v-col>
      <ezr-status-list />
    </v-col>

    <v-col>
      <ezr-cron-list />
    </v-col>

    <v-col>
      <ezr-queue-list />
    </v-col>

    <v-col>
      <ezr-template-list />
    </v-col>

    <v-col>
      <ezr-task-table :current-namespace.sync="currentInstitution" />
    </v-col>

    <v-col>
      <ezr-history-table />
    </v-col>

  </v-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  data: () => ({
    currentInstitution: undefined,
  }),
});
</script>
