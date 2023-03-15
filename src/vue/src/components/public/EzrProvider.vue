<template>
  <div v-if="ready">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import * as sdk from 'ezreeport-sdk-js';
import { type InjectedEzReeport, InjectionEzReeportKey } from '~/mixins/ezr';

export default defineComponent({
  props: {
    token: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    api_url: {
      type: String,
      default: import.meta.env.VITE_REPORT_API,
    },
    institution_logo_url: {
      type: String,
      default: import.meta.env.VITE_INSTITUTIONS_LOGO_URL,
    },
  },
  data: (): InjectedEzReeport['data'] => ({
    ready: false,
    auth: {
      permissions: undefined,
      user: undefined,
    },
    institutions: {
      logoUrl: '',
      data: [],
    },
  }),
  watch: {
    api_url(value: string) {
      sdk.setup.setURL(value);
    },
    institution_logo_url(value: string) {
      this.institutions.logoUrl = value;
    },
    token(value?: string) {
      if (value) {
        this.login(value);
        return;
      }
      this.logout();
    },
  },
  provide() {
    const $ezReeport = {
      sdk,
      fetchInstitutions: (force?: boolean) => this.fetchInstitutions(force),
      login: (token: string) => this.login(token),
      logout: () => this.logout(),
    };

    Object.defineProperties(
      $ezReeport,
      {
        data: {
          enumerable: true,
          get: () => this.$data,
        },
        isLogged: {
          enumerable: true,
          get: () => this.auth.user !== undefined,
        },
      },
    );

    return {
      [InjectionEzReeportKey]: $ezReeport,
    };
  },
  mounted() {
    sdk.setup.setURL(this.api_url);
    this.institutions.logoUrl = this.institution_logo_url;
    if (this.token) {
      this.login(this.token);
    }

    // Rendering childrens will trigger requests to API
    // and it can be before we set the correct URL.
    // ? maybe a v-if on each public component is better tha here
    this.ready = true;
  },
  methods: {
    /**
     * Add token into SDK, fetch permissions & current user
     *
     * @param token The API token for ezMESURE
     */
    login(token: string) {
      sdk.auth.login(token);

      sdk.auth.getPermissions()
        .then(({ content }) => { this.auth.permissions = content; })
        .catch((error: Error) => { console.error('[ezReeport-vue]', error.message); });

      sdk.auth.getCurrentUser()
        .then(({ content }) => { this.auth.user = content; })
        .catch((error: Error) => { console.error('[ezReeport-vue]', error.message); });
    },
    /**
     * Remove token from SDK, clear permissions & current user
     */
    logout() {
      sdk.auth.logout();
      this.auth.permissions = undefined;
      this.auth.user = undefined;
    },
    /**
     * Shorthand to fetch institutions and make it available into whole Vue.
     *
     * If institutions was already fetched before, it will not re-fetch
     *
     * @param force Force reload
     */
    async fetchInstitutions(force = false): Promise<sdk.institutions.Institution[]> {
      if (force || this.institutions.data.length <= 0) {
        if (this.auth.permissions?.['institutions-get']) {
          const { content } = await sdk.institutions.getInstitutions();
          if (!content) {
            throw new Error(this.$t('errors.no_data').toString());
          }

          this.institutions.data = content;
        } else {
          this.institutions.data = [];
        }
      }
      return this.institutions.data;
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  errors:
    no_data: 'An error occurred when fetching data'
fr:
  errors:
    no_data: 'Une erreur est survenue lors de la récupération des données'
</i18n>
