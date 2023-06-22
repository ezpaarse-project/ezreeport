import type VueApp from 'vue';
import { PiniaVuePlugin } from 'pinia';
import components from './components';

import './style';

export default {
  install(app: typeof VueApp) {
    app.use(PiniaVuePlugin);
    // eslint-disable-next-line no-restricted-syntax
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component);
    }
  },

};

export { default as ezReeportMixin } from './mixins/ezr';

export type GlobalEzRComponents = typeof components;
