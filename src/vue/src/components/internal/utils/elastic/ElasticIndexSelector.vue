<template>
  <v-menu
    :disabled="disabled"
    bottom
    offset-y
    nudge-bottom="10"
    open-on-focus
    @input="onMenuVisibilityChangeDebounced"
  >
    <template #activator="{ on, attrs }">
      <v-text-field
        v-model="search"
        :label="label"
        :prepend-icon="prependIcon"
        :rules="innerRules"
        :dense="dense"
        :disabled="disabled"
        :hint="$t('inputHelp', { chars: invalidCharsMessage })"
        v-bind="attrs"
        @input="() => resolveSearch()"
        v-on="on"
      />
    </template>

    <v-card :loading="loading">
      <v-card-text>
        <v-alert v-if="error" type="error">
          {{ error.message }}
        </v-alert>

        <v-row>
          <v-col>
            {{ $tc('nMatchedIndex', resolvedIndices.length) }}
          </v-col>
        </v-row>

        <v-row>
          <v-col class="pt-0">
            <v-simple-table height="200" dense fixed-header>
              <template #default>
                <thead>
                  <tr>
                    <th width="20">{{ $t('index.matched') }}</th>
                    <th>{{ $t('index.name') }}</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="item in autocompleteItems" :key="item">
                    <td>
                      <v-icon v-if="resolvedIndices.length > 0" color="primary" small>mdi-check</v-icon>
                    </td>
                    <td>
                      {{ item }}
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>

          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { debounce } from 'lodash';

import { useEzR } from '~/lib/ezreeport';
import { useI18n } from '~/lib/i18n';
import useTemplateStore from '~/stores/template';

const props = defineProps<{
  value: string,
  label: string,
  namespace?: string,
  rules?: (((v: string) => true | string) | true | string)[]
  required?: boolean
  prependIcon?: string
  dense?: boolean
  disabled?: boolean
}>();

const emit = defineEmits<{
  (e: 'input', value: string): void
}>();

const { sdk } = useEzR();
const templateStore = useTemplateStore();
const { $t, $tc } = useI18n();

const invalidChars = ['\\', '/', '?', '"', '<', '>', '|'];
const invalidCharsMessage = invalidChars.join(' ');

const loading = ref(false);
const error = ref<Error | null>(null);
const search = ref(props.value);
const resolvedIndices = ref<string[]>([]);

const setError = (err: Error) => {
  error.value = err;
  setTimeout(() => { error.value = null; }, 5000);
};

const resolveSearch = async () => {
  if (!search.value) {
    resolvedIndices.value = [];
    return;
  }

  loading.value = true;
  try {
    const { content } = await sdk.elastic.resolveIndex(search.value, props.namespace);
    resolvedIndices.value = content;

    if (resolvedIndices.value.length > 0) {
      emit('input', search.value);
    }
  } catch (err) {
    setError(err as Error);
  }
  loading.value = false;
};

const onMenuVisibilityChange = async (value: boolean) => {
  if (value) {
    loading.value = true;
    try {
      await templateStore.refreshAvailableIndices(props.namespace);
    } catch (err) {
      setError(err as Error);
    }
    loading.value = false;

    if (search.value) {
      await resolveSearch();
    }
  }
};

const onMenuVisibilityChangeDebounced = debounce(
  onMenuVisibilityChange,
  1000,
  { leading: true, trailing: false },
);

const emptyRule = computed(() => {
  if (!props.required) {
    return true;
  }
  return resolvedIndices.value.length > 0 || `${$t('errors.required')}`;
});

const innerRules = computed(() => {
  const invalidCharsRegex = new RegExp(`[${invalidChars.join('')}\\s]`, 'i');

  return [
    (v: string) => !invalidCharsRegex.test(v) || `${$t('errors.invalidChars')} ${invalidCharsMessage}`,
    emptyRule.value,
    ...(props.rules ?? []),
  ];
});

const autocompleteItems = computed(() => {
  if (resolvedIndices.value.length <= 0) {
    const indices = templateStore.indices.available ?? [];
    return indices.filter((v) => v.includes(search.value.trim()));
  }
  return [...resolvedIndices.value];
});

watch(
  () => props.value,
  () => { search.value = props.value; },
);
watch(
  () => props.namespace,
  async (value) => {
    try {
      await templateStore.refreshAvailableIndices(value);
    } catch (err) {
      setError(err as Error);
    }
  },
);
</script>

<i18n lang="yaml">
en:
  inputHelp: Use an asterisk (*) to match multiple indices of your repositories. Spaces and the characters {chars} are not allowed.
  nMatchedIndex: 'The expression includes 1 index from your repositories.|The expression includes {n} indices from your repositories.'
  index:
    matched: Included
    name: Index
  errors:
    invalidChars: 'The expression contains spaces or forbidden characters like:'
    required: 'The expression must include at least one of your index from your repositories.'
fr:
  inputHelp: Utilisez un astérisque (*) pour récupérer plusieurs index de vos entrepôts. Les espaces et les caractères {chars} ne sont pas autorisés.
  nMatchedIndex: 'Le motif inclut 1 index parmi vos entrepôts.|Le motif inclut {n} index parmi vos entrepôts.'
  index:
    matched: Inclus
    name: Index
  errors:
    invalidChars: "L'motif utilise des espaces ou des caractères interdits comme :"
    required: 'Le motif doit inclure au moins un de vos index parmi vos entrepôts.'
</i18n>
