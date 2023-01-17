<template>
  <Story>
    <template #controls>
      <HstText
        :v-model="current"
        title="Task"
      />
    </template>

    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <TaskDialog
            :id="current"
            :show.sync="show"
          />
        </v-theme-provider>

        <div class="mb-4">
          <v-btn @click="show = true">
            Show
          </v-btn>
        </div>
        <HstLocale
          class="mt-4"
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
          <TaskDialog
            :id="current"
            :show.sync="show"
          />
        </v-theme-provider>

        <div class="mb-4">
          <v-btn @click="show = true">
            Show
          </v-btn>
        </div>
        <HstLocale
          class="mt-4"
          direction="bottom"
        />
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { isCollecting } from 'histoire/client';
import { useEzReeport } from '~/index';

const $ezReeport = useEzReeport();

const current = ref('7398ffd9-ab64-48d0-a854-5f0b28b3dca9');
const show = ref(true);

onMounted(() => {
  if (!isCollecting()) {
    // do something only in the browser
    $ezReeport.sdk.auth.login(import.meta.env.VITE_EZMESURE_TOKEN);
  }
});
</script>

<docs lang="md">
# Task Detail Dialog

...
</docs>
