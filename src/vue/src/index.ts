import type VueApp from 'vue';
import components from './components';

import './style';

export default {
  install(app: typeof VueApp) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component);
    }
  },
};

export { default as ezReeportMixin } from './mixins/ezr';

export type GlobalEzRComponents = typeof components;
