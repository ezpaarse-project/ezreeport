import Vue from 'vue';

import ezReeportVuePlugin from '@ezpaarse-project/ezreeport-vue';
import type { GlobalEzRComponents } from '@ezpaarse-project/ezreeport-vue';
import '@ezpaarse-project/ezreeport-vue/dist/style.css';

declare module 'vue' {
  export interface GlobalComponents extends GlobalEzRComponents {}
}

Vue.use(ezReeportVuePlugin);
