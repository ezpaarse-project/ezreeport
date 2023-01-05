import type Vue from 'vue';
import components from './components';

export default {
  install(app: typeof Vue) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component);
    }
  },
};
