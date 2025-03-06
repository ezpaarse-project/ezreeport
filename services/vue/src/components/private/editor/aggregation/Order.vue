<template>
  <div>
    <v-label :text="t('$ezreeport.editor.figures._.order')" />
  </div>

  <v-btn-toggle
    v-model="value"
    color="primary"
  >
    <v-btn
      :text="t('$ezreeport.editor.order.desc')"
      :readonly="readonly"
      append-icon="mdi-sort-numeric-descending"
      value="desc"
    />

    <v-btn
      :text="t('$ezreeport.editor.order.asc')"
      :readonly="readonly"
      append-icon="mdi-sort-numeric-ascending"
      value="asc"
    />
  </v-btn-toggle>
</template>

<script setup lang="ts">
import type { FigureOrder } from '~sdk/helpers/figures';

// Components props
const props = defineProps<{
  /** The table figure to edit */
  modelValue?: FigureOrder,
  /** Should be readonly */
  readonly?: boolean,
}>();

// Components events
const emit = defineEmits<{
  /** Updated figure */
  (e: 'update:modelValue', value: FigureOrder): void
}>();

// Util composables
const { t } = useI18n();

/** Value for the button group */
const value = computed<'asc' | 'desc' | undefined>({
  get: () => {
    const v = props.modelValue ?? true;
    if (v === true) {
      return 'desc';
    }
    if (v === false) {
      return undefined;
    }
    return v;
  },
  set: (v) => {
    emit('update:modelValue', v || false);
  },
});
</script>
