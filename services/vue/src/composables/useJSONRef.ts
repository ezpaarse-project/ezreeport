import { ref, watch, toValue, type MaybeRefOrGetter } from 'vue';
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

export default function useJSONRef<Data = Record<string, unknown>>(
  initial: MaybeRefOrGetter<Data>
) {
  const hasChanged = shallowRef(false);
  const parseError = ref<Error | undefined>();
  const value = shallowRef(getInitialJson(initial));

  const { on: onChange, trigger: changeTrigger } = createEventHook<Data>();

  async function apply(): Promise<void> {
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
