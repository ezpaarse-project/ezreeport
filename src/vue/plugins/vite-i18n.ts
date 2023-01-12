import { Plugin } from 'vite';

// Adds support for i18n blocks
const vueI18nPlugin: Plugin = {
  name: 'vue-i18n',
  async transform(code, id) {
    let c = code;
    if (!/vue&type=i18n/.test(id)) {
      return undefined;
    }
    if (/\.ya?ml$/.test(id)) {
      c = JSON.stringify((await import('js-yaml')).load(code.trim()));
    }
    return `export default Comp => {
      Comp.i18n = ${c}
    }`;
  },
};

export default vueI18nPlugin;
