/**
 * Workaround to properly type $t from i18n
 * https://nuxt.com/blog/v3-13#vue-typescript-changes
 */

import type {
  ComponentCustomOptions as _ComponentCustomOptions,
  ComponentCustomProperties as _ComponentCustomProperties,
} from 'vue';

declare module 'vue' {
  interface ComponentCustomProperties extends _ComponentCustomProperties {}
  interface ComponentCustomOptions extends _ComponentCustomOptions {}
}
