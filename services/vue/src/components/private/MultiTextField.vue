<template>
  <div>
    <v-label :text="label" />

    <v-text-field
      v-if="!readonly"
      v-model="inputValue"
      :placeholder="$t('$ezreeport.addMultiValue')"
      :variant="variant"
      :error-messages="errorMessages"
      :prepend-icon="prependIcon"
      :density="density"
      hide-details="auto"
      @keyup.enter="addValue(inputValue)"
    />

    <v-slide-group class="py-2">
      <v-slide-group-item
        v-for="element in elements"
        :key="element"
      >
        <v-chip
          density="comfortable"
          :closable="!readonly"
          class="mr-2"
          @click:close="remValue(element)"
        >
          <span class="value-chip">{{ element }}</span>
        </v-chip>
      </v-slide-group-item>
    </v-slide-group>

    <div
      v-if="elements.length === 0"
      class="text-caption font-italic text-grey"
    >
      {{ $t('$ezreeport.noValues') }}
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
}>();

// Component events
const emit = defineEmits<{
  /** Updated values */
  (e: 'update:modelValue', value: string | string[] | undefined): void,
}>();

/** Inner value */
const inputValue = ref('');

/** Values as an array */
const elements = computed(() => {
  if (!props.modelValue) {
    return [];
  }

  if (Array.isArray(props.modelValue)) {
    return props.modelValue;
  }

  return [props.modelValue];
});

/** Error messages using given rules */
const errorMessages = computed(() => {
  if (!props.rules) {
    return undefined;
  }

  return props.rules
    .map((rule) => rule(elements.value) || 'Error')
    .filter((v) => v !== true);
});

/**
 * Add a new value
 */
function addValue(value: string) {
  inputValue.value = '';
  if (elements.value.includes(value)) {
    return;
  }

  if (elements.value.length === 0) {
    emit('update:modelValue', value);
    return;
  }

  const values = [...elements.value, value];
  emit('update:modelValue', values);
}

/**
 * Remove a value
 */
function remValue(value: string) {
  const values = elements.value.filter((el) => el !== value);

  if (elements.value.length === 1) {
    emit('update:modelValue', values[0]);
    return;
  }

  if (elements.value.length === 0) {
    emit('update:modelValue', undefined);
  }

  emit('update:modelValue', values);
}
</script>

<style scoped>
.value-chip {
  display: inline-block;
  vertical-align: bottom;
  max-width: 15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
