<template>
  <v-autocomplete
    v-model="value"
    v-model:search="search"
    :items="selectItems"
    :multiple="Array.isArray(modelValue) || modelValue === null"
    variant="outlined"
    density="comfortable"
    hide-details="auto"
    @click:clear="modelValue = undefined"
  >
    <template v-if="allowEmpty && !search" #prepend-item>
      <v-list-item
        :title="$t('$ezreeport.api-filters.empty')"
        :disabled="isEmptyDisabled"
        @click="toggleEmpty()"
      >
        <template #prepend>
          <v-checkbox-btn
            :model-value="isEmptyActive"
            :ripple="false"
            color="primary"
            readonly
          />
        </template>
      </v-list-item>

      <v-divider class="mb-2" />
    </template>

    <template v-if="$slots.chip" #chip="chip">
      <slot name="chip" v-bind="chip" />
    </template>

    <template v-if="$slots.item" #item="item">
      <slot name="item" v-bind="item" />
    </template>
  </v-autocomplete>
</template>

<script setup lang="ts">
type VAutocompleteItem =
  | string
  | {
      title: string;
      value: string;
      props?: Record<string, unknown>;
    };

// Component props
const modelValue = defineModel<string | string[] | null | undefined>({
  default: undefined,
});

const { items, allowEmpty } = defineProps<{
  items?: VAutocompleteItem[];
  allowEmpty?: boolean;
}>();

// Utils composable
// oxlint-disable-next-line id-length
const { t } = useI18n();

const search = shallowRef('');

const value = computed({
  get: () => {
    if (allowEmpty && modelValue.value === '') {
      return t('$ezreeport.api-filters.empty');
    }
    return modelValue.value;
  },
  set: (val) => {
    modelValue.value = val;
  },
});

const isEmptyActive = computed(() => modelValue.value === null);
const isEmptyDisabled = computed(
  () => Array.isArray(modelValue.value) && modelValue.value.length > 0
);
const selectItems = computed(() => {
  if (!items) {
    return [];
  }

  return items.map((item) => {
    const baseProps = {
      disabled: allowEmpty && isEmptyActive.value,
      color: 'primary',
    };

    if (typeof item === 'string') {
      return {
        title: item,
        value: item,
        props: baseProps,
      };
    }

    return {
      ...item,
      props: {
        ...baseProps,
        ...item.props,
      },
    };
  });
});

function toggleEmpty(): void {
  modelValue.value = isEmptyActive.value ? [] : null;
}
</script>
