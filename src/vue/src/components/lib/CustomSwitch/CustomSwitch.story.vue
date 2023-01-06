<template>
  <Story>
    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <CustomSwitch label="My switch" />
        </v-theme-provider>
      </v-app>
    </Variant>

    <Variant
      title="Dark theme"
      icon="material-symbols:dark-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider dark>
          <CustomSwitch label="My switch" />
        </v-theme-provider>
      </v-app>
    </Variant>

    <Variant
      title="Reversed"
      icon="material-symbols:compare-arrows"
    >
      <v-app style="background: transparent">
        <CustomSwitch
          label="My switch"
          reverse
        />
      </v-app>
    </Variant>

    <Variant
      title="Expanded"
      icon="mdi:arrow-expand-horizontal"
    >
      <v-app style="background: transparent">
        <CustomSwitch
          label="My expanded switch"
          expand
          reverse
        />
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { isCollecting } from 'histoire/client';
import { setup } from 'reporting-sdk-js';
import { onMounted } from 'vue';
import CustomSwitch from '.';

onMounted(() => {
  if (!isCollecting()) {
    // do something only in the browser
    setup.setURL(import.meta.env.VITE_REPORT_API);
  }
});
</script>

<docs lang="md">
# CustomSwitch

Wrapper of `v-switch` with few more options :

- `reverse` (boolean) - "Reverse" switch so label can be at the left of the button
- `expand` (boolean) - Expand label in order to take whole width
</docs>
