import Vue from 'vue';
import ezReeportVuePlugin, { type GlobalEzRComponents } from 'ezreeport-vue';

declare module 'vue' {
  export interface GlobalComponents extends GlobalEzRComponents {}
}

Vue.use(ezReeportVuePlugin);
