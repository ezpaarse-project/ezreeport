import {
  ref,
  watch,
  toValue,
  type MaybeRefOrGetter,
} from 'vue';
import { createEventHook, useDebounceFn } from '@vueuse/core';

function getInitialJson(initial: MaybeRefOrGetter<unknown>): string {
  const original = toValue(initial);

  if (!original) {
    return '';
  }

  try {
    return JSON.stringify(toValue(initial), undefined, 4);
  } catch {
    return '';
  }
}

export default function useJSONRef<T = Record<string, unknown>>(initial: MaybeRefOrGetter<T>) {
  const hasChanged = ref(false);
  const parseError = ref<Error | undefined>();
  const value = ref(getInitialJson(initial));

  const { on: onChange, trigger: changeTrigger } = createEventHook<T>();

  async function apply() {
    const original = toValue(initial);
    if (!original) {
      return;
    }

    try {
      await changeTrigger(JSON.parse(value.value));
      parseError.value = undefined;
    } catch (error) {
      parseError.value = error instanceof Error ? error : new Error(`${error}`);
      return;
    }

    value.value = getInitialJson(initial);
    hasChanged.value = false;
  }

  const debouncedApply = useDebounceFn(apply, 500);

  watch(value, () => {
    hasChanged.value = true;
    debouncedApply();
  });

  return {
    hasChanged,
    parseError,
    value,
    onChange,
  };
}
