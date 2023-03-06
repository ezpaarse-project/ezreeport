// eslint-disable-next-line import/no-extraneous-dependencies
import * as sdk from 'ezreeport-sdk-js';
import { reactive } from 'vue';

// Defining plugin's data
const data = reactive({
  auth: {
    permissions: undefined as sdk.auth.Permissions | undefined,
    user: undefined as sdk.auth.User | undefined,
  },
  institutions: {
    logoUrl: '',
    data: [] as sdk.institutions.Institution[],
    /**
     * Shorthand to fetch institutions and make it available into whole Vue.
     *
     * If institutions was already fetched before, it will not re-fetch
     *
     * @param force Force reload
     */
    fetch: async (force = false): Promise<sdk.institutions.Institution[]> => {
      if (force || data.institutions.data.length <= 0) {
        if (data.auth.permissions?.['institutions-get']) {
          const { content } = await sdk.institutions.getInstitutions();
          data.institutions.data = content;
        } else {
          data.institutions.data = [];
        }
      }
      return data.institutions.data;
    },
  },
});

type EzReeportData = typeof data;

/**
 * Add token into SDK, fetch permissions & current user
 *
 * @param token The API token for ezMESURE
 */
const login = (token: string) => {
  sdk.auth.login(token);

  sdk.auth.getPermissions()
    .then(({ content }) => { data.auth.permissions = content; })
    .catch((error: Error) => { console.error('[ezReeport-vue]', error.message); });

  sdk.auth.getCurrentUser()
    .then(({ content }) => { data.auth.user = content; })
    .catch((error: Error) => { console.error('[ezReeport-vue]', error.message); });
};
/**
 * Remove token from SDK, clear permissions & current user
 */
const logout = () => {
  sdk.auth.logout();
  data.auth.permissions = undefined;
  data.auth.user = undefined;
};

// Add SDK to global property (while not making it reactive)
interface EzReeportCustom {
  sdk: sdk.EzReeportSDK,
}
type EzReeport = EzReeportData & EzReeportCustom;

Object.assign<EzReeportData, EzReeportCustom>(
  data,
  {
    sdk: {
      ...sdk,
      auth: {
        ...sdk.auth,
        login,
        logout,
      },
      setup: {
        ...sdk.setup,
        login,
        logout,
      },
    },
  },
);

/**
 * API Composition version of `this.$ezReeport`.
 *
 * **Do not use Object Destructuring with this as it will loose reactivity**.
 *
 * @returns Vue's plugin data
 */
export const useEzReeport = () => data as EzReeport;

/**
 * Vue's plugin data at init
 */
export default data as EzReeport;
