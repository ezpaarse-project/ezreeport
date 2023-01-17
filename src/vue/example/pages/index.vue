<template>
  <v-row
    justify="center"
    align="center"
  >
    <v-btn @click="changeLocale">
      {{ locale }}
    </v-btn>
    <v-col>
      <v-card>
        <ezr-task-table />
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  data: () => ({
    locale: 'fr',
  }),
  mounted() {
    this.$ezReeport.sdk.auth.login(this.$config.ezMesureToken);
  },
  methods: {
    changeLocale() {
      this.locale = this.locale === 'en' ? 'fr' : 'en';
      this.$i18n.setLocale(this.locale);
    },
  },
});
</script>
