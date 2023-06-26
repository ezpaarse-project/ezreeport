import Vue from 'vue';

import ezReeportVuePlugin from '@ezpaarse-project/ezreeport-vue';
import type { GlobalEzRComponents } from '@ezpaarse-project/ezreeport-vue';
import type { Plugin } from '@nuxt/types';
import '@ezpaarse-project/ezreeport-vue/dist/style.css';

declare module 'vue' {
  export interface GlobalComponents extends GlobalEzRComponents {}
}

// eslint-disable-next-line func-names
const ezrNuxt: Plugin = ({ i18n }) => {
  Vue.use(ezReeportVuePlugin, { i18n });
};

export default ezrNuxt;
