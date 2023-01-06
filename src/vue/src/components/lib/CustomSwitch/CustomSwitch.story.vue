<template>
  <Story>
    <template #controls>
      <HstCheckbox
        v-model="state.expand"
        title="Expand"
      />
      <HstCheckbox
        v-model="state.reverse"
        title="Reverse"
      />
    </template>

    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <CustomSwitch
            label="My switch"
            :expand="state.expand"
            :reverse="state.reverse"
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
          <CustomSwitch
            label="My switch"
            :expand="state.expand"
            :reverse="state.reverse"
          />
        </v-theme-provider>
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import CustomSwitch from '.';

const state = reactive({
  expand: false,
  reverse: false,
});
</script>

<docs lang="md">
# CustomSwitch

Wrapper of `v-switch` with few more options :

- `reverse` (boolean) - "Reverse" switch so label can be at the left of the button
- `expand` (boolean) - Expand label in order to take whole width
</docs>
