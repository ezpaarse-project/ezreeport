import type VueApp from 'vue';
import ezReeport from './ezReeport';
import components from './components';

import './style';

export type EzReeportOptions = {
  api_url?: 'string',
};

export default {
  install(app: typeof VueApp, options: EzReeportOptions) {
    // Setup SDK
    ezReeport.sdk.setup.setURL(options?.api_url ?? import.meta.env.VITE_REPORT_API);

    // eslint-disable-next-line no-param-reassign
    app.prototype.$ezReeport = ezReeport;

    // eslint-disable-next-line no-restricted-syntax
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component);
    }
  },
};

export { useEzReeport } from './ezReeport';

declare module 'vue/types/vue' {
  interface Vue {
    /**
     * Shorthand to access reporting SDK and few more data (like current permissions)
     */
    $ezReeport: typeof ezReeport;
  }
}
