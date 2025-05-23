<template>
  <v-text-field
    ref="fieldRef"
    :model-value="formatted"
    :label="label"
    :variant="variant"
    :rules="innerRules"
    :prepend-icon="prependIcon"
    :hint="hint"
    :persistent-hint="hint !== undefined"
    readonly
  />

  <v-menu
    :activator="fieldRef?.$el"
    :close-on-content-click="false"
    min-width="350"
    max-width="350"
  >
    <v-sheet class="d-flex justify-center">
      <v-date-picker
        v-model="date"
        :min="min"
        :max="max"
        first-day-of-week="1"
        show-adjacent-months
      />
    </v-sheet>
  </v-menu>
</template>

<script setup lang="ts">
import { format as formatDate } from 'date-fns';

const props = defineProps<{
  modelValue: Date,
  format?: string,
  label?: string,
  variant?: 'filled' | 'underlined' | 'outlined' | 'plain' | 'solo' | 'solo-inverted' | 'solo-filled',
  rules?: ((v: Date) => boolean | string)[]
  prependIcon?: string,
  hint?: string,
  min?: Date,
  max?: Date,
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Date): void
}>();

const { locale } = useDateLocale();

/** Ref on text field */
const fieldRef = useTemplateRef('fieldRef');

const date = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const formatted = computed(
  () => formatDate(props.modelValue, props.format || 'PPP', { locale: locale.value }),
);

const innerRules = computed(() => (props.rules ?? []).map((rule) => rule(props.modelValue)));
</script>
