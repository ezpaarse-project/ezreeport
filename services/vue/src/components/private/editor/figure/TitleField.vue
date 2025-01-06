<template>
  <v-text-field
    ref="input"
    :model-value="modelValue"
    :label="$t('$ezreeport.editor.figures._.title')"
    :readonly="readonly"
    prepend-icon="mdi-rename"
    variant="underlined"
    hide-details
    @update:model-value="$emit('update:model-value', $event)"
  />

  <v-menu :activator="inputRef?.$el" :disabled="readonly" :close-on-content-click="false">
    <v-list>
      <v-list-subheader :title="$t('$ezreeport.editor.vars')" />

      <v-list-item
        v-for="variable in variablesOptions"
        :key="variable.value"
        :title="$te(`$ezreeport.editor.varsList.${variable.title}`) ? $t(`$ezreeport.editor.varsList.${variable.title}`) : undefined"
        :subtitle="variable.value"
        :value="variable.value"
        class="font-italic"
        @click="onVariableClick(variable.value)"
      />
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { variablesOptions } from '~/lib/figures';

const props = defineProps<{
  modelValue?: string;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:model-value', value: string): void;
}>();

const inputRef = useTemplateRef('input');

function onVariableClick(variable: string) {
  emit('update:model-value', `${props.modelValue ?? ''} ${variable}`);
  inputRef.value?.focus();
}
</script>
