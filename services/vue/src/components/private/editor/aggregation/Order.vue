<template>
  <div>
    <v-label :text="t('$ezreeport.editor.figures._.order')" />
  </div>

  <v-btn-toggle v-model="value" color="primary">
    <v-btn
      :text="t('$ezreeport.editor.order.desc')"
      :readonly="readonly"
      :append-icon="mdiSortNumericDescending"
      value="desc"
    />

    <v-btn
      :text="t('$ezreeport.editor.order.asc')"
      :readonly="readonly"
      :append-icon="mdiSortNumericAscending"
      value="asc"
    />
  </v-btn-toggle>
</template>

<script setup lang="ts">
  import type { FigureOrder } from '~sdk/helpers/figures';
  import { mdiSortNumericAscending, mdiSortNumericDescending } from '@mdi/js';

  // Components props
  const props = defineProps<{
    /** The table figure to edit */
    modelValue?: FigureOrder;
    /** Should be readonly */
    readonly?: boolean;
  }>();

  // Components events
  const emit = defineEmits<{
    /** Updated figure */
    (event: 'update:modelValue', value: FigureOrder): void;
  }>();

  // Util composables
  const { t } = useI18n();

  /** Value for the button group */
  const value = computed<'asc' | 'desc' | undefined>({
    get: () => {
      const val = props.modelValue ?? true;
      if (val === true) {
        return 'desc';
      }
      if (val === false) {
        return;
      }
      return val;
    },
    set: (val) => {
      emit('update:modelValue', val || false);
    },
  });
</script>
