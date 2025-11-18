<template>
  <div class="container">
    <div v-if="prependIcon" class="icon mr-4">
      <v-icon :icon="prependIcon" />
    </div>
    <div>
      <v-label v-if="label" :text="label" class="label" />

      <v-btn-toggle
        v-model="modelValue"
        color="primary"
        density="comfortable"
        variant="outlined"
        rounded
      >
        <v-btn v-for="btn in buttons" :key="`${btn.value}`" v-bind="btn" />
      </v-btn-toggle>
    </div>
  </div>
</template>

<script setup lang="ts">
type PrimitiveValue = boolean | string | number;
type Value = PrimitiveValue | { text: string; value: PrimitiveValue };

// Components props
const modelValue = defineModel<Value | undefined>();

const { items = [true, false] } = defineProps<{
  items?: Value[];
  label?: string;
  prependIcon?: `mdi-${string}`;
}>();

// Utils composable
// oxlint-disable-next-line id-length
const { t } = useI18n();

const buttons = computed(() =>
  items.map((item) => {
    let value: PrimitiveValue = '';
    let text = '';
    let props = {};

    if (typeof item === 'boolean') {
      value = item;
      text = item ? t('$ezreeport.yes') : t('$ezreeport.no');
    }

    if (typeof item === 'string' || typeof item === 'number') {
      value = item;
      text = `${item}`;
    }

    if (typeof item === 'object') {
      ({ value, text, ...props } = item);
    }

    return {
      ...props,
      value,
      text,
      size: 'small',
    };
  })
);
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  align-items: center;

  & .icon {
    color: gray;
  }

  & .label {
    position: absolute !important;
    max-width: 133%;
    transform-origin: top left;
    transform: translateY(-16px) scale(0.75);

    & + * {
      transform: translateY(5px);
    }
  }
}
</style>
