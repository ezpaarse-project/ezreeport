import type * as sdk from 'ezreeport-sdk-js';

interface EzReeportVueData {
  ready: boolean,
  auth: {
    permissions?: sdk.auth.Permissions
    user?: sdk.auth.User
  }
  institutions: {
    logoUrl: string,
    data: sdk.institutions.Institution[]
  }
}

interface EzReeportVueMethods {
  fetchInstitutions: (force?: boolean) => Promise<sdk.institutions.Institution[]>,
  login: (token: string) => void,
  logout: () => void,
}

export type InjectedEzReeport = EzReeportVueMethods & {
  data: EzReeportVueData,
  isLogged: boolean,
  sdk: sdk.EzReeportSDK
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
