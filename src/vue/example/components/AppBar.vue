<template>
  <v-app-bar>
    <v-toolbar-title>{{ $t('title') }}</v-toolbar-title>

    <v-spacer />

    <div class="d-flex align-center">
      <v-text-field :value="url" label="API URL" dense hide-details class="mx-2" @change="$emit('update:url', $event)" />

      <div>
        <v-btn @click="updateAuth" color="primary">
          {{ $t($ezReeport.isLogged ? 'actions.logout' : 'actions.login') }}
        </v-btn>
      </div>

      <v-select
        :value="locale"
        :items="locales"
        :label="$t('headers.lang')"
        outlined
        dense
        hide-details
        class="mx-2"
        @change="$i18n.setLocale"
      />

      <v-switch
        :input-value="$vuetify.theme.dark"
        inset
        dense
        hide-details
        @change="$vuetify.theme.dark = !$vuetify.theme.dark"
      >
        <template #label>
          <v-icon>
            mdi-{{ $vuetify.theme.dark ? 'weather-night' : 'weather-sunny' }}
          </v-icon>
        </template>
      </v-switch>
    </div>
  </v-app-bar>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ezReeportMixin } from 'ezreeport-vue';

export default defineComponent({
  props: {
    url: {
      type: String,
      required: true,
    },
  },
  mixins: [ezReeportMixin],
  data: () => ({
    locale: 'fr',
    locales: ['fr', 'en'],
  }),
  methods: {
    updateAuth(): void {
      if (this.$ezReeport.isLogged) {
        return this.$ezReeport.logout();
      }
      return this.$ezReeport.login(this.$config.authToken);
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  title: 'Nuxt integration of ezReeport-vue'
  headers:
    lang: 'Language'
  actions:
    login: 'Login'
    logout: 'Logout'
fr:
  title: "Intégration à Nuxt d'ezReeport-vue"
  headers:
    lang: 'Langue'
  actions:
    login: 'Connexion'
    logout: 'Déconnexion'
</i18n>
