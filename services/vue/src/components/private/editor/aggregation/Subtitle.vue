<template>
  <template v-if="hasSubtitle">
    <template v-if="!modelValue">
      {{ $t('$ezreeport.editor.aggregation.types._count') }}
    </template>

    <i v-else-if="'raw' in modelValue">
      {{ $t('$ezreeport.editor.aggregation.raw') }}
    </i>

    <i18n-t
      v-else
      keypath="$ezreeport.editor.aggregation.aggregationTemplate"
    >
      <template #type>
        <b class="text-capitalize">{{ modelValue.type }}</b>
      </template>

      <template #field>
        <b>{{ modelValue.field }}</b>
      </template>
    </i18n-t>
  </template>
</template>

<script setup lang="ts">
import { type FigureAggregation, isRawAggregation } from '~sdk/helpers/aggregations';

// Components props
const props = defineProps<{
  modelValue?: FigureAggregation
  name?: string
}>();

// Utils function
const { t } = useI18n();

/** Does the element need a subtitle */
const hasSubtitle = computed(() => {
  // No need to show anything
  if (!props.modelValue) {
    return true;
  }

  // We need to show the subtitle
  if (isRawAggregation(props.modelValue)) {
    return true;
  }

  // If the text is the same, we don't need to show the subtitle
  const text = t(
    '$ezreeport.editor.aggregation.aggregationTemplate',
    props.modelValue,
  );
  if (text === props.name) {
    return false;
  }

  return true;
});
</script>
