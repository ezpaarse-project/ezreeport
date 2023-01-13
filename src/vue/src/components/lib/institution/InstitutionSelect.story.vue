<template>
  <Story>
    <Variant
      title="Light theme"
      icon="material-symbols:light-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider light>
          <InstitutionSelect
            v-model="current"
            @input="logEvent('input', $event)"
          />
        </v-theme-provider>
        <HstLocale />
      </v-app>
    </Variant>

    <Variant
      title="Dark theme"
      icon="material-symbols:dark-mode-outline"
    >
      <v-app style="background: transparent">
        <v-theme-provider dark>
          <InstitutionSelect
            v-model="current"
            @input="logEvent('input', $event)"
          />
        </v-theme-provider>
        <HstLocale />
      </v-app>
    </Variant>
  </Story>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { isCollecting, logEvent } from 'histoire/client';
import { useEzReeport } from '~/index';

const $ezReeport = useEzReeport();

const current = ref('');

onMounted(() => {
  if (!isCollecting()) {
    // do something only in the browser
    $ezReeport.auth_token = import.meta.env.VITE_EZMESURE_TOKEN;
  }
});
</script>

<docs lang="md">
# Institution Select

...
</docs>
