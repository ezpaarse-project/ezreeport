import { getCurrentInstance, ref } from 'vue';

export class LocalizedError extends Error {}

/**
 * Export the i18n methods from vue
 *
 * @returns i18n methods
 */
export function useI18n() {
  const ctx = getCurrentInstance()?.proxy;
  if (!ctx) {
    throw new Error("Couldn't get Vue context");
  }

  return {
    i18n: ctx.$i18n,
    locale: ref(ctx?.$i18n.locale),
    $t: ctx.$t.bind(ctx),
    $tc: ctx.$tc.bind(ctx),
    $te: ctx.$te.bind(ctx),
    $d: ctx.$d.bind(ctx),
    $n: ctx.$n.bind(ctx),
  };
}
