// eslint-disable-next-line import/no-extraneous-dependencies
import * as sdk from 'ezreeport-sdk-js';
import { reactive } from 'vue';

type AuthPermissions = Awaited<ReturnType<typeof sdk.auth.getPermissions>>['content'];

interface EzReeportData {
  auth_permissions: AuthPermissions | undefined,
}

// Defining plugin's data
const data = reactive<EzReeportData>({
  auth_permissions: undefined,
});

/**
 * Add token into SDK and fetch permissions
 *
 * @param token The API token for ezMESURE
 */
const login = (token: string) => {
  sdk.auth.login(token);
  sdk.auth.getPermissions()
    .then(({ content }) => { data.auth_permissions = content; })
    .catch((error: Error) => { console.error('[ezReeport-vue]', error); });
};
/**
 * Remove token from SDK and clear permissions
 */
const logout = () => {
  sdk.auth.logout();
  data.auth_permissions = undefined;
};

// Add SDK to global property (while not making it reactive)
Object.assign<EzReeportData, { sdk: sdk.EzReeportSDK }>(data, {
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
});

/**
 * API Composition version of `this.$ezReeport`.
 *
 * **Do not use Object Destructuring with this as it will loose reactivity**.
 *
 * @returns Vue's plugin data
 */
export const useEzReeport = () => data as EzReeportData & { sdk: sdk.EzReeportSDK };

/**
 * Vue's plugin data at init
 */
export default data as EzReeportData & { sdk: sdk.EzReeportSDK };
