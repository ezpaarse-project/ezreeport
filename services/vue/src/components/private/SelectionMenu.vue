<template>
  <v-menu v-model="open" location="top">
    <template #activator="{ props: menu }">
      <v-slide-y-reverse-transition>
        <v-btn
          v-show="modelValue.length > 0"
          :text="text"
          :prepend-icon="open ? mdiChevronDown : mdiChevronUp"
          color="primary"
          position="fixed"
          location="bottom right"
          size="large"
          style="bottom: 1rem; right: 1rem"
          v-bind="menu"
        />
      </v-slide-y-reverse-transition>
    </template>

    <v-list>
      <slot name="actions" />

      <v-divider v-if="$slots.actions" />

      <v-list-item
        :title="$t('$ezreeport.deselect')"
        :prepend-icon="mdiClose"
        @click="$emit('update:modelValue', [])"
      />
    </v-list>
  </v-menu>
</template>

<script lang="ts" setup>
  import { mdiChevronDown, mdiChevronUp, mdiClose } from '@mdi/js';

  defineProps<{
    modelValue: string[];
    text: string;
  }>();

  defineEmits<{
    (event: 'update:modelValue', selection: string[]): void;
  }>();

  const open = ref(false);
</script>
