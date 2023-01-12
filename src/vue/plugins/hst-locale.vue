<template>
  <v-speed-dial
    v-model="open"
    bottom
    left
    transition="slide-y-reverse-transition"
    style="width: fit-content"
  >
    <template #activator>
      <v-btn
        v-model="open"
        dark
        fab
      >
        {{ locale }}
      </v-btn>
    </template>
    <v-btn
      fab
      dark
      small
      :color="locale === 'fr' ? 'primary' : undefined"
      @click="locale = 'fr'"
    >
      FR
    </v-btn>
    <v-btn
      fab
      dark
      small
      :color="locale === 'en' ? 'primary' : undefined"
      @click="locale = 'en'"
    >
      EN
    </v-btn>
  </v-speed-dial>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  data: () => ({
    open: false,
  }),
  computed: {
    locale: {
      get(): string {
        return this.$i18n.locale;
      },
      set(value: string) {
        this.$i18n.locale = value;
      },
    },
  },
});
</script>

<style scoped>

</style>
