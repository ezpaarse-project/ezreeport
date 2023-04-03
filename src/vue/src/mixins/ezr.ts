import type * as sdk from 'ezreeport-sdk-js';

interface EzReeportVueData {
  /**
   * Is provider ready
   */
  ready: boolean,
  /**
   * Auth data
   */
  auth: {
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
  }
  /**
   * Namespaces data
   */
  namespaces: {
    /**
     * The url used to resolve logos
     */
    logoUrl: string,
    /**
     * Accessible namespaces
     */
    data: sdk.namespaces.Namespace[]
  }
}

interface EzReeportVueMethods {
  /**
   * Add token into SDK, fetch permissions & current user
   *
   * @param token The API token for ezMESURE
   */
  login: (token: string) => void,
  /**
   * Remove token from SDK, clear permissions & current user
   */
  logout: () => void,
  /**
   * Check if logged user have permission to do some action
   *
   * @param permission The permission name
   *
   * @returns If the user have the permission
   */
  hasGeneralPermission: (permission: string) => boolean,
  /**
   * Check if logged user have permission in namespaces to do some action
   *
   * @param permission The permission name
   * @param namespaces The concerned namespaces. If empty will attempt
   * to find at least one in all possibles
   *
   * @returns If the user have the permission
   */
  hasNamespacedPermission: (permission: string, namespaces: string[]) => boolean,
  /**
   * Shorthand to fetch namespaces and make it available into whole Vue.
   *
   * If namespaces was already fetched before, it will not re-fetch
   *
   * @param force Force reload
   */
  fetchNamespaces: (force?: boolean) => Promise<sdk.namespaces.Namespace[]>,
  /**
   * Get localized name of namespace
   *
   * @param capitalize Should capitalize result
   * @param choice optional, default 1
   *
   * @returns The localized name
   */
  tcNamespace: (capitalize?: boolean, choice?: number) => string,
}

export type InjectedEzReeport = EzReeportVueMethods & {
  data: EzReeportVueData,
  isLogged: boolean,
  sdk: sdk.EzReeportSDK,
};

export const InjectionEzReeportKey = Symbol('injected EzReeport data');

export default {
  inject: {
    ezR: InjectionEzReeportKey,
  },
  computed: {
    /**
     * Shorthand to access reporting SDK and few more data (like current permissions)
     */
    $ezReeport(): InjectedEzReeport { return (this as any).ezR; },
  },
};
