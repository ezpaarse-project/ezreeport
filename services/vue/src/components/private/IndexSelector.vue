<template>
  <v-text-field
    v-model="index"
    ref="indexRef"
    :label="$t('$ezreeport.template.index')"
    :hint="$t('$ezreeport.index.help', { chars: invalidCharsMessage })"
    :rules="innerRules"
    :density="density"
    :disabled="disabled"
    :required="required"
    :readonly="readonly"
    prepend-icon="mdi-database"
    variant="underlined"
  />
  <v-menu :activator="indexRef?.$el" @update:model-value="$event && refresh()">
    <v-card>
      <template #text>
        <v-alert
          v-if="error"
          :text="error.message"
          type="error"
        />

        <v-row>
          <v-col>
            {{ $t('$ezreeport.index.matched:count', resolvedIndices.length) }}
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-table height="300" density="compact" fixed-header>
              <thead>
                <tr>
                  <th width="20">{{ $t('$ezreeport.index.matched') }}</th>
                  <th>{{ $t('$ezreeport.index.name') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in autocompleteIndices"
                  :key="item"
                >
                  <td><v-icon v-if="resolvedIndices.includes(item)" icon="mdi-check" color="primary" small /></td>
                  <td>{{ item }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-col>
        </v-row>
      </template>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { getAllIndices } from '~sdk/elastic';

// Constants
const invalidChars = ['\\', '/', '?', '"', '<', '>', '|'];
const invalidCharsMessage = invalidChars.join(' ');

// Components props
const props = defineProps<{
  modelValue: string | undefined,
  namespaceId?: string,
  rules?: (((v: string) => true | string) | true | string)[]
  required?: boolean
  density?: 'comfortable' | 'compact' | 'default'
  disabled?: boolean
  readonly?: boolean
}>();

// Components events
const emit = defineEmits<{
  (e: 'update:model-value', value: string): void
  (e: 'index:valid', value: string): void
}>();

// Utils composables
const { t } = useI18n();

/* Is the input loading */
const loading = ref(false);
/** The resolved indices */
const resolvedIndices = ref<string[]>([]);
/** The available indices */
const availableIndices = ref<string[]>([]);
/** The error, if any */
const error = ref<Error | undefined>(undefined);

/** Ref on text field */
const indexRef = useTemplateRef('indexRef');

/** Current value of index */
const index = computed<string>({
  get: () => props.modelValue || '',
  set: (v) => emit('update:model-value', v || ''),
});
/** Indices to show in menu */
const autocompleteIndices = computed(() => {
  if (resolvedIndices.value.length > 0) {
    return [...resolvedIndices.value];
  }

  if (index.value.length > 0) {
    return availableIndices.value
      .filter((v) => v.includes(index.value.trim()));
  }

  return availableIndices.value;
});
/** User provided rules + default rules */
const innerRules = computed(() => {
  const invalidCharsRegex = new RegExp(`[${invalidChars.join('')}\\s]`, 'i');

  return [
    (v: string) => !invalidCharsRegex.test(v) || t('$ezreeport.index.invalidChars', { message: invalidCharsMessage }),
    () => resolvedIndices.value.length > 0 || `${t('$ezreeport.index.required')}`,
    ...(props.rules ?? []),
  ];
});

/**
 * Reload the available indices
 */
async function fetchIndices() {
  loading.value = true;
  try {
    availableIndices.value = await getAllIndices(props.namespaceId);
  } catch (err) {
    error.value = err instanceof Error ? err : new Error(`${err}`);
    setTimeout(() => { error.value = undefined; }, 5000);
    availableIndices.value = [];
  }
  loading.value = false;
}

/**
 * Resolve the available indices using current value
 */
async function resolveIndex() {
  if (!index.value) {
    resolvedIndices.value = [];
    indexRef.value?.validate();
    return;
  }

  loading.value = true;
  try {
    const indices = await getAllIndices(props.namespaceId, index.value);
    resolvedIndices.value = indices;
    if (resolvedIndices.value.length > 0) {
      emit('index:valid', index.value);
    }
  } catch (err) {
    error.value = err instanceof Error ? err : new Error(`${err}`);
    setTimeout(() => { error.value = undefined; }, 5000);
    resolvedIndices.value = [];
  }
  loading.value = false;
  indexRef.value?.validate();
}

async function refresh() {
  await Promise.all([
    fetchIndices(),
    resolveIndex(),
  ]);
}

watch(index, () => resolveIndex());
watch(() => props.namespaceId, () => refresh());
</script>
