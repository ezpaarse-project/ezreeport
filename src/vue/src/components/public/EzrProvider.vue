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
    apiUrl: {
      type: String,
      default: import.meta.env.VITE_REPORT_API,
    },
    namespaceLogoUrl: {
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
    namespaces: {
      data: [],
      logoUrl: '',
    },
  }),
  watch: {
    apiUrl(value: string) {
      sdk.setup.setURL(value);
    },
    namespaceLogoUrl(value: string) {
      this.namespaces.logoUrl = value;
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
      hasGeneralPermission: (permission: string) => this.hasGeneralPermission(permission),
      hasNamespacedPermission: (
        permission: string,
        namespaces: string[],
      ) => this.hasNamespacedPermission(permission, namespaces),
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
    sdk.setup.setURL(this.apiUrl);
    this.namespaces.logoUrl = this.namespaceLogoUrl;
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

      Promise.allSettled([
        sdk.auth.getCurrentPermissions()
          .then(({ content }) => { this.auth.permissions = content; }),

        sdk.auth.getCurrentUser()
          .then(({ content }) => { this.auth.user = content; }),

        this.fetchInstitutions(),
      ]).then((results) => {
        // eslint-disable-next-line no-restricted-syntax
        for (const res of results) {
          if (res.status === 'rejected') {
            console.error('[ezReeport-vue]', res.reason.message);
          }
        }
      });
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
    async fetchInstitutions(force = false): Promise<sdk.namespaces.Namespace[]> {
      if (force || this.namespaces.data.length <= 0) {
        if (this.hasNamespacedPermission('auth-get-namespaces', [])) {
          const { content } = await sdk.auth.getCurrentNamespaces();
          if (!content) {
            throw new Error(this.$t('errors.no_data').toString());
          }

          this.namespaces.data = content;
        } else {
          this.namespaces.data = [];
        }
      }
      return this.namespaces.data;
    },
    /**
     * Check if logged user have permission to do some action
     *
     * @param permission The permission name
     *
     * @returns If the user have the permission
     */
    hasGeneralPermission(permission: string) {
      return !!this.auth.permissions?.general[permission];
    },
    /**
     * Check if logged user have permission in namespaces to do some action
     *
     * @param permission The permission name
     * @param namespaces The concerned namespaces. If empty will attempt
     * to find at least one in all possibles
     *
     * @returns If the user have the permission
     */
    hasNamespacedPermission(permission: string, namespaces: string[]) {
      let entries = Object.entries(this.auth.permissions?.namespaces ?? {});

      if (namespaces.length > 0) {
        entries = entries.filter(([namespace]) => namespaces.includes(namespace));
      }
      return !!entries.find(([, perms]) => perms[permission]);
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
