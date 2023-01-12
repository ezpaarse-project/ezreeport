// eslint-disable-next-line import/no-extraneous-dependencies
import * as sdk from 'ezreeport-sdk-js';
import { reactive, watch } from 'vue';

type AuthPermissions = Awaited<ReturnType<typeof sdk.auth.getPermissions>>['content'];

interface EzReeportData {
  api_url: string | undefined,
  auth_permissions: AuthPermissions | undefined,
  auth_token: string | undefined,
}

const data = reactive<EzReeportData>({
  api_url: undefined,
  auth_permissions: undefined,
  auth_token: undefined,
});
Object.assign(data, sdk);

// Update SDK if API URL changes
watch(() => data.api_url, (value) => {
  if (value) {
    sdk.setup.setURL(value);
  } else {
    sdk.setup.unsetURL();
  }
});

// Update SDK if token changes + fetch permissions
watch(() => data.auth_token, async (value) => {
  if (value) {
    sdk.setup.login(value);
  } else {
    sdk.setup.logout();
  }

  try {
    const { content } = await sdk.auth.getPermissions();
    data.auth_permissions = content;
  } catch (error) {
    console.error('[ezReeport-vue]', error);
  }
});

/**
 * API Composition version of `this.$ezReeport`.
 *
 * **Do not use Object Destructuring with this as it will loose reactivity**.
 *
 * @returns Vue's plugin data
 */
export const useEzReeport = () => data as EzReeportData & sdk.EzReeportSDK;

/**
 * Vue's plugin data at init
 */
export default data as EzReeportData & sdk.EzReeportSDK;
