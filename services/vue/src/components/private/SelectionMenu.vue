<template>
  <v-menu v-model="open" location="top">
    <template #activator="{ props: menu }">
      <v-slide-y-reverse-transition>
        <v-btn
          v-show="modelValue.length > 0"
          :text="text"
          :prepend-icon="open ? 'mdi-chevron-down' : 'mdi-chevron-up'"
          color="primary"
          position="fixed"
          location="bottom right"
          size="large"
          style="bottom: 1rem; right: 1rem;"
          v-bind="menu"
        />
      </v-slide-y-reverse-transition>
    </template>

    <v-list>
      <slot name="actions" />

      <v-divider v-if="$slots.actions" />

      <v-list-item
        :title="$t('$ezreeport.deselect')"
        prepend-icon="mdi-close"
        @click="$emit('update:modelValue', [])"
      />
    </v-list>
  </v-menu>
</template>

<script lang="ts" setup>
defineProps<{
  modelValue: string[],
  text: string,
}>();

defineEmits<{
  (e: 'update:modelValue', selection: string[]): void
}>();

const open = ref(false);
</script>
