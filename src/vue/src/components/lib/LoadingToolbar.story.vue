<template>
  <Story>
    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <div>
          <LoadingToolbar text="My component" />
        </div>
      </v-app>
    </Variant>

    <Variant
      title="Dark theme"
      icon="material-symbols:dark-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider dark>
          <div>
            <LoadingToolbar text="My component" />
          </div>
        </v-theme-provider>
      </v-app>
    </Variant>

    <Variant
      title="Loading"
      icon="material-symbols:refresh"
    >
      <v-app style="background: transparent">
        <div>
          <LoadingToolbar
            text="My component"
            loading
          />
        </div>
      </v-app>
    </Variant>

    <Variant title="Custom content">
      <v-app style="background: transparent">
        <div>
          <LoadingToolbar text="My component">
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
</script>

<docs lang="md">
# LoadingToolbar

Wrapper of `v-toolbar` with a `v-progress-linear`.
</docs>
