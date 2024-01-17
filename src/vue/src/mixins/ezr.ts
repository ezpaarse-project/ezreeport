import type { useEzR } from '~/lib/ezreeport';

type EzR = ReturnType<typeof useEzR>;

/**
 * @deprecated Use `setup()` and `useEzR()`
 */
export interface InjectedEzReeport extends Omit<EzR, 'auth' | 'namespaces' | 'isLogged'> {
  data: {
    auth: EzR['auth']['value'],
    namespaces: EzR['namespaces']['value'],
  },
  isLogged: EzR['isLogged']['value'],
}

export const InjectionEzReeportKey = Symbol('injected EzReeport data');

/**
 * @deprecated Use `setup()` and `useEzR()`
 */
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
