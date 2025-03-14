<template>
  <div class="d-flex">
    <div v-if="prependIcon" style="width: 24px; margin-right: 1rem;">
      <v-icon :icon="prependIcon" color="grey-darken-1" />
    </div>

    <div style="flex: 1;">
      <v-label :text="`${label || ''} (${elements.length})`" class="mb-0" />

      <v-slide-x-transition tag="div" group>
        <v-chip
          v-for="(message, i) in errorMessages"
          :key="`err${i}`"
          :text="message"
          prepend-icon="mdi-alert-circle"
          density="comfortable"
          variant="elevated"
          class="value-chip my-1"
          color="error"
        />
      </v-slide-x-transition>

      <v-slide-x-transition
        ref="scrollerRef"
        tag="div"
        group
        class="container"
      >
        <v-chip
          v-for="(item, i) in elements"
          :key="i"
          :closable="!readonly"
          :color="(itemErrors.get(item)?.length ?? 0) > 0 ? 'error' : undefined"
          density="comfortable"
          class="value-chip my-1"
          @click:close="remValue(item)"
        >
          <v-text-field
            :model-value="item"
            density="compact"
            variant="plain"
            hide-details
            class="mb-2"
            @update:model-value="editValue(item, $event)"
          />
        </v-chip>
      </v-slide-x-transition>

      <v-chip
        v-if="!readonly"
        :text="$t('$ezreeport.addMultiValue')"
        prepend-icon="mdi-plus"
        density="comfortable"
        variant="elevated"
        class="value-chip mt-1"
        color="green"
        @click="addValue()"
      />

      <v-combobox v-model="elements" :rules="rules" multiple class="d-none" />
    </div>

  </div>
</template>

<script setup lang="ts">
// Component props
const props = defineProps<{
  /** Values to edit */
  modelValue?: string | string[],
  /** Is the field readonly */
  readonly?: boolean,
  /** Icon to prepend */
  prependIcon?: string,
  /** Label for the field */
  label?: string,
  /** Field variant */
  variant?: 'filled' | 'underlined' | 'outlined' | 'plain' | 'solo' | 'solo-inverted' | 'solo-filled',
  /** Field density */
  density?: 'default' | 'comfortable' | 'compact',
  /** Rules for the field */
  rules?: ((v: string[]) => boolean | string)[],
  /** Rules for each item */
  itemRules?: ((v: string) => boolean | string)[],
  /** Maximum number of items */
  count?: number,
}>();

// Component events
const emit = defineEmits<{
  /** Updated values */
  (e: 'update:modelValue', value: string | string[] | undefined): void,
}>();

const scrollerRef = useTemplateRef('scrollerRef');

/** Values as an array */
const elements = computed({
  get: () => {
    if (props.modelValue == null) {
      return [];
    }

    if (Array.isArray(props.modelValue)) {
      return props.modelValue;
    }

    return [props.modelValue];
  },
  set: (v) => {
    if (v.length === 1) {
      emit('update:modelValue', v[0]);
      return;
    }

    if (v.length === 0) {
      emit('update:modelValue', undefined);
      return;
    }

    emit('update:modelValue', Array.from(new Set(v)));
  },
});

const containerHeight = computed(() => `${Math.min(props.count ?? 6, elements.value.length) * (36 + 2)}px`);

const rulesErrors = computed((): string[] => {
  if (!props.rules) {
    return [];
  }

  return props.rules
    .map((rule) => rule(elements.value) || 'Error')
    .filter((v) => v !== true);
});

const itemErrors = computed((): Map<string, string[]> => {
  if (!props.itemRules) {
    return new Map();
  }

  const rules = props.itemRules;

  return new Map(
    elements.value.map((key) => [
      key,
      rules
        .map((rule) => rule(key) || 'Error')
        .filter((v) => v !== true),
    ]),
  );
});

/** Error messages using given rules */
const errorMessages = computed(() => new Set([
  ...rulesErrors.value,
  ...Array.from(itemErrors.value.values()).flat(),
]));

async function scrollToBottom() {
  await nextTick();
  const element = scrollerRef.value?.$el as HTMLDivElement | undefined;
  if (!element) {
    return;
  }
  element.scrollTop = element.scrollHeight;
}

/**
 * Add a new value
 */
function addValue() {
  const values = [...elements.value, ''];
  elements.value = values;
  scrollToBottom();
}

/**
 * Remove a value
 */
function remValue(value: string) {
  const values = elements.value.filter((el) => el !== value);
  elements.value = values;
}

/**
 * Edit a value
 */
function editValue(oldValue: string, newValue: string) {
  const values = elements.value.map((el) => (el === oldValue ? newValue : el));
  elements.value = values;
}
</script>

<style lang="scss" scoped>
.container {
  height: v-bind('containerHeight');
  overflow-x: auto;
  scroll-behavior: smooth;
}

.value-chip {
  width: 97%;

  :deep(.v-chip__content) {
    width: 100%;

    & > span {
      display: inline-block;
      vertical-align: bottom;
      max-width: 15rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>
