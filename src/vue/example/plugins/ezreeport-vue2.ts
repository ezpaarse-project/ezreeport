import Vue from 'vue';
import ezReeportVuePlugin, { type InjectedEzRComponents } from 'ezreeport-vue';

declare module 'vue' {
  export interface GlobalComponents extends InjectedEzRComponents {}
}

Vue.use(ezReeportVuePlugin);
