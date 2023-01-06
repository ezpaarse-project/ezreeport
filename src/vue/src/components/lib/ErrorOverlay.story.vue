<template>
  <Story>
    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <div style="position: relative; height: 5rem;">
            <ErrorOverlay error="A mock error occured" />
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
            <ErrorOverlay error="A mock error occured" />
          </div>
        </v-theme-provider>
      </v-app>
    </Variant>

    <Variant
      title="No error"
      icon="material-symbols:check-circle-outline"
    >
      <v-app style="background: transparent">
        <div style="position: relative; height: 5rem;">
          <ErrorOverlay />
        </div>
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { isCollecting } from 'histoire/client';
import { setup } from 'reporting-sdk-js';
import { onMounted } from 'vue';

onMounted(() => {
  if (!isCollecting()) {
    // do something only in the browser
    setup.setURL(import.meta.env.VITE_REPORT_API);
  }
});
</script>

<docs lang="md">
# ErrorOverlay

Wrapper of `v-overlay`.

Needs parent to have a `postion: relative`.
</docs>
