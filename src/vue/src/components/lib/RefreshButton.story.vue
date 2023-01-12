<template>
  <Story>
    <template #controls>
      <HstCheckbox
        v-model="state.loading"
        title="Loading"
      />
      <HstCheckbox
        v-model="state.disabled"
        title="Disabled"
      />
      <HstText
        v-model="state.tooltip"
        title="Error"
      />
    </template>

    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <RefreshButton
            :loading="state.loading"
            :disabled="state.disabled"
            :tooltip="state.tooltip"
          />
        </v-theme-provider>
      </v-app>
    </Variant>

    <Variant
      title="Dark theme"
      icon="material-symbols:dark-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider dark>
          <RefreshButton
            :loading="state.loading"
            :disabled="state.disabled"
            :tooltip="state.tooltip"
          />
        </v-theme-provider>
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const state = reactive({
  loading: false,
  disabled: false,
  tooltip: 'Explain button',
});
</script>

<docs lang="md">
# RefreshButton

Wrapper of a `v-button` inside a `v-tooltip`.
</docs>
