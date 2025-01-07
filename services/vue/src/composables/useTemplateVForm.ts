import { onMounted } from 'vue';
import type { VForm } from 'vuetify/components';

type UseVFormOptions = {
  immediate: boolean
};

export default function useTemplateVForm(key: string, opts?: UseVFormOptions) {
  const { immediate = false } = opts ?? {};

  const formRef = useTemplateRef<VForm>(key);

  if (immediate) {
    onMounted(() => {
      formRef.value?.validate();
    });
  }

  return formRef;
}
