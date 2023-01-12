<template>
  <Story>
    <template #controls>
      <HstText
        v-model="state.title"
        title="Title"
      />
      <HstText
        v-model="state.subtitle"
        title="Subtitle"
      />
      <HstCheckbox
        v-model="state.capitalizeSubtitle"
        title="Capitalize subtitle"
      />
      <HstText
        v-model="state.src"
        title="Image"
      />
      <HstText
        v-model="state.alt"
        title="Image's alt"
      />
      <HstText
        v-model="state.fallbackIcon"
        title="Fallback Icon"
      />
    </template>

    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <RichListItem v-bind="state" />
        </v-theme-provider>
      </v-app>
    </Variant>

    <Variant
      title="Dark theme"
      icon="material-symbols:dark-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider dark>
          <RichListItem v-bind="state" />
        </v-theme-provider>
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const state = reactive({
  title: 'Name',
  subtitle: 'subtitle',
  capitalizeSubtitle: false,
  src: undefined as string | undefined,
  alt: undefined as string | undefined,
  fallbackIcon: 'mdi-image-off',
});

</script>

<docs lang="md">
# Institution Item

...
</docs>
