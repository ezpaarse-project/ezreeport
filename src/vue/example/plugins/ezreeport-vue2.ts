import Vue from 'vue';
import ezReeportVuePlugin, { type InjectedEzRData, type InjectedEzRComponents } from 'ezreeport-vue';

declare module 'vue/types/vue' {
  interface Vue {
    /**
     * Shorthand to access reporting SDK and few more data (like current permissions)
     */
    $ezReeport: InjectedEzRData;
  }
}

declare module 'vue' {
  export interface GlobalComponents extends InjectedEzRComponents {}
}

Vue.use(ezReeportVuePlugin);
