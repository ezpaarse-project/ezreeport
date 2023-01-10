import type VueApp from 'vue';
import ezReeport from '../plugins/ezReeport';
import components from './components';

type ReportingOptions = {
  api_url?: 'string',
};

export default {
  install(app: typeof VueApp, options: ReportingOptions) {
    // Setup SDK
    ezReeport.api_url = options?.api_url ?? import.meta.env.VITE_REPORT_API;

    // eslint-disable-next-line no-param-reassign
    app.prototype.$ezReeport = ezReeport;

    // eslint-disable-next-line no-restricted-syntax
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component);
    }
  },
};

export { useEzReeport } from '../plugins/ezReeport';

declare module 'vue/types/vue' {
  interface Vue {
    /**
     * Shorthand to access reporting SDK and few more data (like current permissions)
     */
    $ezReeport: typeof ezReeport;
  }
}
