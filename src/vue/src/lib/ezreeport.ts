import * as sdk from '@ezpaarse-project/ezreeport-sdk-js';
import {
  computed,
  onMounted,
  ref,
  set,
} from 'vue';
import { LocalizedError, useI18n } from './i18n';

/**
 * Auth data
 */
type EzRAuthData = {
  /**
   * Permissions of the current logged in user
   *
   * You may want to use `hasGeneralPermission` or `hasNamespacedPermission` instead of this
   */
  permissions?: sdk.auth.Permissions
  /**
   * The curent user data
   */
  user?: sdk.auth.User
};

/**
 * Namespaces data
 */
type EzRNamespaceData = {
  /**
   * labels for each locale of 'namespace' in i18n format
   */
  label: Record<string, string>
  /**
   * The icon to use to represent them
   */
  icon: string
  /**
   * The url used to resolve logos
   */
  logoUrl: string
  /**
   * Accessible namespaces
   */
  data: sdk.namespaces.Namespace[]
};

const auth = ref<EzRAuthData>({});
const namespaces = ref<EzRNamespaceData>({
  label: {
    fr: 'espace|espaces',
    en: 'namespace|namespaces',
  },
  icon: 'mdi-folder',
  data: [],
  logoUrl: '',
});

/**
 * Check if logged user have permission to do some action
 *
 * @param permission The permission name
 *
 * @returns If the user have the permission
 */
const hasGeneralPermission = (permission: string) => !!auth.value.permissions?.general[permission];

/**
 * Check if logged user have permission in namespaces to do some action
 *
 * @param permission The permission name
 * @param nms The concerned namespaces. If empty will attempt
 * to find at least one in all possibles
 *
 * @returns If the user have the permission
 */
const hasNamespacedPermission = (permission: string, nms: string[]): boolean => {
  let entries = Object.entries(auth.value.permissions?.namespaces ?? {});
  const namespaceSet = new Set(nms);

  if (nms.length > 0) {
    entries = entries.filter(([namespace]) => namespaceSet.has(namespace));
  }
  return !!entries.find(([, perms]) => perms[permission]);
};

/**
 * Shorthand to fetch namespaces and make it available into whole Vue.
 *
 * If namespaces was already fetched before, it will not re-fetch
 *
 * @param force Force reload
 */
const fetchNamespaces = async (force?: boolean): Promise<sdk.namespaces.Namespace[]> => {
  if (!force && namespaces.value.data.length > 0) {
    return namespaces.value.data;
  }

  if (!hasNamespacedPermission('auth-get-namespaces', [])) {
    set(namespaces.value, 'data', []);
    return [];
  }

  const { content } = await sdk.auth.getCurrentNamespaces();
  if (!content) {
    throw new LocalizedError('$ezreeport.errors.fetch');
  }

  set(namespaces.value, 'data', content);
  return content;
};

const isPromiseRejected = (res: PromiseSettledResult<unknown>): res is PromiseRejectedResult => res.status === 'rejected';

/**
 * Add token into SDK, fetch permissions & current user
 *
 * @param token The API token for ezREEPORT
 *
 * @returns errors if any
 */
const login = async (token: string) => {
  sdk.auth.login(token);

  const errors = (
    await Promise.allSettled([
      sdk.auth.getCurrentPermissions()
        .then(({ content }) => {
          set(auth.value, 'permissions', content);
        }),

      sdk.auth.getCurrentUser()
        .then(({ content }) => {
          set(auth.value, 'user', content);
        }),
    ])
  ).filter(isPromiseRejected).map((r) => r.reason);

  // eslint-disable-next-line no-restricted-syntax
  for (const res of errors) {
    console.error('[ezReeport-vue]', res.message);
  }

  return errors;
};

/**
 * Remove token from SDK, clear permissions & current user
 */
const logout = () => {
  sdk.auth.logout();
  set(auth.value, 'permissions', undefined);
  set(auth.value, 'user', undefined);
};

export function useEzR() {
  const { $t, $tc, i18n } = useI18n();

  onMounted(() => {
    // eslint-disable-next-line no-restricted-syntax
    for (const [l, label] of Object.entries(namespaces.value.label)) {
      i18n.mergeLocaleMessage(l, { $ezreeport: { namespace: label } });
    }
  });

  /**
   * Get localized name of namespace
   *
   * @param capitalize Should capitalize result
   * @param choice optional, default 1
   *
   * @returns The localized name
   */
  const tcNamespace = (capitalize?: boolean, choice?: number): string => {
    const res = $tc('$ezreeport.namespace', choice).toString();

    if (capitalize) {
      return `${res.at(0)?.toLocaleUpperCase() ?? ''}${res.slice(1)}`;
    }
    return res;
  };

  return {
    sdk: sdk as sdk.EzReeportSDK,

    auth,
    namespaces,

    isLogged: computed(() => !!auth.value.user),

    login,
    logout,
    hasGeneralPermission,
    hasNamespacedPermission,
    fetchNamespaces: (force?: boolean) => fetchNamespaces(force)
      .catch((e) => {
        throw e instanceof LocalizedError ? new Error($t(e.message).toString()) : e;
      }),
    tcNamespace,
  };
}

export { sdk };
