<template>
  <v-app>
    <ezr-provider :api-url="apiUrl">
      <v-main>
        <AppBar :url.sync="apiUrl" />

        <v-container>
          <Nuxt />
        </v-container>
      </v-main>
    </ezr-provider>
  </v-app>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  data: () => ({
    apiUrl: 'http://localhost:8080/v1/',
  }),
});
</script>
