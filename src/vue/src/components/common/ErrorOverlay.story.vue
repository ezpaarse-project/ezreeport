<template>
  <Story>
    <template #controls>
      <HstText
        v-model="state.error"
        title="Error"
      />
    </template>

    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <div style="position: relative; height: 5rem;">
            <ErrorOverlay v-model="state.error" />
          </div>
        </v-theme-provider>
      </v-app>
    </Variant>

    <Variant
      title="Dark theme"
      icon="material-symbols:dark-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider dark>
          <div style="position: relative; height: 5rem;">
            <ErrorOverlay v-model="state.error" />
          </div>
        </v-theme-provider>
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const state = reactive({
  error: 'A mock error occurred',
});
</script>

<docs lang="md">
# ErrorOverlay

Wrapper of `v-overlay`.

Needs parent to have a `postion: relative`.
</docs>
