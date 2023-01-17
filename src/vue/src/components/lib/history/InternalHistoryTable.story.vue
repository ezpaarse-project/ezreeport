<template>
  <Story>
    <template #controls>
      <HstCheckbox
        v-model="state.hideTask"
        title="Hide Task"
      />
      <HstCheckbox
        v-model="state.hideInstitution"
        title="Hide Institution"
      />
    </template>

    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <InternalHistoryTable :history="[]" />
        </v-theme-provider>
        <HstLocale
          direction="bottom"
        />
      </v-app>
    </Variant>

    <Variant
      title="Dark theme"
      icon="material-symbols:dark-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider dark>
          <InternalHistoryTable :history="[]" />
        </v-theme-provider>
        <HstLocale
          direction="bottom"
        />
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const state = reactive({
  hideTask: false,
  hideInstitution: false,
});

// TODO: mock
</script>

<docs lang="md">
# Internal History Table

...
</docs>
