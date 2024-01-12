<template>
  <component v-bind:is="as">
    <slot />
  </component>
</template>

<script setup lang="ts">
import {
  watch,
  ref,
  onMounted,
  set,
  provide,
  type PropType,
} from 'vue';
import { InjectionEzReeportKey } from '~/mixins/ezr';
import { useEzR } from '~/lib/ezreeport';
import { useI18n } from '~/lib/i18n';

const props = defineProps({
  as: {
    type: String,
    default: 'div',
  },
  token: {
    type: String as PropType<string | undefined>,
    default: undefined,
  },
  apiUrl: {
    type: String as PropType<string | undefined>,
    default: undefined,
  },
  namespaceLogoUrl: {
    type: String as PropType<string | undefined>,
    default: undefined,
  },
  namespaceLabel: {
    type: Object as PropType<Record<string, string>>,
    default: () => ({}),
  },
  namespaceIcon: {
    type: String as PropType<string | undefined>,
    default: undefined,
  },
});

const emit = defineEmits<{
  (event: 'error', err: Error): void;
  (event: 'error:auth', err: Error): void;
}>();

const ezr = useEzR();
const { locale } = useI18n();

const { sdk, namespaces } = ezr;

const ready = ref(false);

const login = async (token: string) => {
  const errors = await ezr.login(token);
  // eslint-disable-next-line no-restricted-syntax
  for (const err of errors) {
    emit('error', err);
    emit('error:auth', err);
  }
};

watch(
  () => props.apiUrl,
  (value) => {
    sdk.setup.setURL(value || import.meta.env.VITE_REPORT_API);
  },
  { immediate: true },
);
watch(
  () => props.namespaceLogoUrl,
  (value) => {
    set(namespaces.value, 'logoUrl', value || import.meta.env.VITE_NAMESPACES_LOGO_URL);
  },
  { immediate: true },
);
watch(
  [locale, () => props.namespaceLabel],
  () => {
    set(namespaces.value, 'label', props.namespaceLabel);
  },
  { immediate: true },
);
watch(
  () => props.namespaceIcon,
  (value) => {
    set(namespaces, 'icon', value);
  },
  { immediate: true },
);
watch(
  () => props.token,
  async (value) => {
    ezr.logout();
    if (value) {
      await login(value);
    }
  },
  { immediate: true },
);

onMounted(() => {
  ready.value = true;
});

// Option API compatibility
provide(
  InjectionEzReeportKey,
  (() => {
    const {
      auth,
      namespaces: nms,
      isLogged,
      ...$ezr
    } = ezr;

    return {
      ...$ezr,

      login,

      get data() {
        return {
          auth: auth.value,
          namespaces: nms.value,
        };
      },

      get isLogged() {
        return isLogged.value;
      },
    };
  })(),
);
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  namespace: 'namespace|namespaces'
  errors:
    no_data: 'An error occurred when fetching data'
fr:
  namespace: 'espace|espaces'
  errors:
    no_data: 'Une erreur est survenue lors de la récupération des données'
</i18n>
