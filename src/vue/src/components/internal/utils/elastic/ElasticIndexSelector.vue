<template>
  <v-menu
    :disabled="disabled"
    bottom
    offset-y
    @input="onMenuVisibilityChange"
  >
    <template #activator="{ on, attrs }">
      <v-text-field
        v-model="search"
        :label="label"
        :prepend-icon="prependIcon"
        :rules="innerRules"
        :dense="dense"
        :disabled="disabled"
        v-bind="attrs"
        @input="() => resolveSearch()"
        v-on="on"
      >
        <template #append>
          <v-icon
            :color="focused ? 'primary' : ''"
            :style="{ transform: focused ? 'rotate(180deg)' : '', transition: 'transform 0.3s' }"
          >
            mdi-menu-down
          </v-icon>
        </template>
      </v-text-field>
    </template>

    <v-card :loading="loading">
      <v-card-text>
        <v-row>
          <v-col>
            {{ $tc('nMatchedIndex', resolvedIndices.length) }}
          </v-col>
        </v-row>

        <v-row>
          <v-col class="pt-0">
            <v-virtual-scroll
              :items="autocompleteItems"
              max-height="200"
              item-height="40"
              bench="5"
            >
              <template v-slot:default="{ item }">
                <v-list-item :key="item" dense>
                  <v-list-item-action>
                    <v-icon v-if="resolvedIndices.length > 0" color="primary" small>mdi-check</v-icon>
                  </v-list-item-action>

                  <v-list-item-content>
                    <v-list-item-title>{{ item }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </template>
            </v-virtual-scroll>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

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

const focused = ref(false);
const loading = ref(false);
const search = ref(props.value);
const resolvedIndices = ref<string[]>([]);

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
  } catch (error) {
    console.error(error);
  }
  loading.value = false;
};

const onMenuVisibilityChange = async (value: boolean) => {
  focused.value = value;

  if (value) {
    loading.value = true;
    try {
      await templateStore.refreshAvailableIndices(props.namespace);
    } catch (error) {
      console.error(error);
    }
    loading.value = false;

    if (search.value) {
      await resolveSearch();
    }
  }
};

const emptyRule = computed(() => {
  if (!props.required) {
    return true;
  }
  return resolvedIndices.value.length > 0 || `${$t('errors.required')}`;
});

const innerRules = computed(() => {
  const invalidChars = /[\\/?"<>|\s]/i;

  return [
    (v: string) => !invalidChars.test(v) || `${$t('errors.invalidChars')} \\ / ? " > < |`,
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
    } catch (error) {
      console.error(error);
    }
  },
);
</script>

<i18n lang="yaml">
en:
  nMatchedIndex: 'Your selection includes 1 index|Your selection includes {n} indices'
  errors:
    invalidChars: "The expression contains spaces or forbidden characters like :"
    required: "Your selection must include at least one index"
fr:
  nMatchedIndex: 'Votre sélection inclue 1 index|Votre sélection inclue {n} indices'
  errors:
    invalidChars: "L'expression utilise des espaces ou des caractères interdits comme :"
    required: "Votre sélection doit inclure au moins un index"
</i18n>
