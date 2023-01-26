import type { Plugin } from 'vite';

// Adds support for i18n blocks
const vueI18nPlugin: Plugin = {
  name: 'vue-i18n',
  async transform(code, id) {
    let c = code;
    let messages;
    if (!/vue&type=i18n/.test(id)) {
      return undefined;
    }
    if (/\.ya?ml$/.test(id)) {
      messages = (await import('js-yaml')).load(code.trim());
      c = JSON.stringify(messages);
    }

    return `export default (Comp) => {
      Comp.i18n = Comp.i18n ?? {};
      Comp.i18n.messages = { ...(Comp.i18n.messages ?? {}), ...${c} };
    }`;
  },
};

export default vueI18nPlugin;
