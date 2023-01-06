<template>
  <Story>
    <template #controls>
      <HstText
        v-model="state.text"
        title="Text"
      />
      <HstCheckbox
        v-model="state.loading"
        title="Loading"
      />
    </template>

    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <div>
            <LoadingToolbar
              :text="state.text"
              :loading="state.loading"
            />
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
          <div>
            <LoadingToolbar
              :text="state.text"
              :loading="state.loading"
            />
          </div>
        </v-theme-provider>
      </v-app>
    </Variant>

    <Variant title="Custom content">
      <v-app style="background: transparent">
        <div>
          <LoadingToolbar
            :text="state.text"
            :loading="state.loading"
          >
            <v-btn text>
              Action
            </v-btn>
          </LoadingToolbar>
        </div>
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const state = reactive({
  text: 'My component',
  loading: false,
});
</script>

<docs lang="md">
# LoadingToolbar

Wrapper of `v-toolbar` with a `v-progress-linear`.
</docs>
