<template>
  <v-text-field
    v-model="modelValue"
    ref="indexRef"
    :label="$t('$ezreeport.template.index')"
    :hint="$t('$ezreeport.index.help', { chars: invalidCharsMessage })"
    :rules="innerRules"
    :density="density"
    :disabled="disabled"
    :required="required"
    :readonly="readonly"
    :prepend-icon="mdiDatabase"
    variant="underlined"
  />
  <v-menu
    :activator="indexRef?.$el"
    :close-on-content-click="false"
    @update:model-value="$event && refresh()"
  >
    <v-card>
      <template #text>
        <v-alert v-if="errorAlert" :text="errorAlert.message" type="error" />

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
                  class="index-row"
                  @click="modelValue = item"
                >
                  <td>
                    <v-icon
                      v-if="resolvedIndices.includes(item)"
                      :icon="mdiCheck"
                      color="primary"
                      small
                    />
                  </td>
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
  import { mdiCheck, mdiDatabase } from '@mdi/js';
  import { getAllIndices } from '~sdk/elastic';

  // Constants
  const ERROR_ALERT_DURATION = 5000;
  const invalidChars = ['\\', '/', '?', '"', '<', '>', '|'];
  const invalidCharsMessage = invalidChars.join(' ');

  const modelValue = defineModel<string>({ default: '' });

  // Components props
  const props = defineProps<{
    namespaceId?: string;
    rules?: (((val: string) => true | string) | true | string)[];
    required?: boolean;
    density?: 'comfortable' | 'compact' | 'default';
    disabled?: boolean;
    readonly?: boolean;
  }>();

  // Components events
  const emit = defineEmits<{
    // oxlint-disable-next-line typescript/unified-signatures
    (event: 'index:valid', value: string): void;
  }>();

  // Utils composables
  const { t } = useI18n();

  /* Is the input loading */
  const loading = shallowRef(false);
  /** The resolved indices */
  const resolvedIndices = ref<string[]>([]);
  /** The available indices */
  const availableIndices = ref<string[]>([]);
  /** The error, if any */
  const errorAlert = ref<Error | undefined>(undefined);

  /** Ref on text field */
  const indexRef = useTemplateRef('indexRef');

  /** Indices to show in menu */
  const autocompleteIndices = computed(() => {
    if (resolvedIndices.value.length > 0) {
      return [...resolvedIndices.value];
    }

    if (modelValue.value.length > 0) {
      return availableIndices.value.filter((val) =>
        val.includes(modelValue.value.trim())
      );
    }

    return availableIndices.value;
  });
  /** User provided rules + default rules */
  const innerRules = computed(() => {
    const invalidCharsRegex = new RegExp(`[${invalidChars.join('')}\\s]`, 'iu');

    return [
      (val: string): true | string =>
        !invalidCharsRegex.test(val) ||
        t('$ezreeport.index.invalidChars', { message: invalidCharsMessage }),
      (): true | string =>
        resolvedIndices.value.length > 0 || `${t('$ezreeport.index.required')}`,
      ...(props.rules ?? []),
    ];
  });

  /**
   * Reload the available indices
   */
  async function fetchIndices(): Promise<void> {
    loading.value = true;
    try {
      availableIndices.value = await getAllIndices(props.namespaceId);
    } catch (error) {
      errorAlert.value = error instanceof Error ? error : new Error(`${error}`);
      setTimeout(() => {
        errorAlert.value = undefined;
      }, ERROR_ALERT_DURATION);
      availableIndices.value = [];
    }
    loading.value = false;
  }

  /**
   * Resolve the available indices using current value
   */
  async function resolveIndex(): Promise<void> {
    if (!modelValue.value) {
      resolvedIndices.value = [];
      indexRef.value?.validate();
      return;
    }

    loading.value = true;
    try {
      const indices = await getAllIndices(props.namespaceId, modelValue.value);
      resolvedIndices.value = indices;
      if (resolvedIndices.value.length > 0) {
        emit('index:valid', modelValue.value);
      }
    } catch (error) {
      errorAlert.value = error instanceof Error ? error : new Error(`${error}`);
      setTimeout(() => {
        errorAlert.value = undefined;
      }, ERROR_ALERT_DURATION);
      resolvedIndices.value = [];
    }
    loading.value = false;
    indexRef.value?.validate();
  }

  async function refresh(): Promise<void> {
    await Promise.all([fetchIndices(), resolveIndex()]);
  }

  watch(modelValue, () => resolveIndex(), { immediate: true });
  watch(
    () => props.namespaceId,
    () => refresh()
  );
</script>

<style scoped>
  .index-row {
    cursor: pointer;
    background-color: transparent;
    transition: background-color 0.15s;

    &:hover {
      background-color: rgba(var(--v-border-color), var(--v-hover-opacity));
    }
  }
</style>
