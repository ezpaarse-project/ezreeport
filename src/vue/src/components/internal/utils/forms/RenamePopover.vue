<template>
  <v-tooltip top>
    <template #activator="{ on: ttOn }">
      <v-menu
        :close-on-content-click="false"
        min-width="300"
      >
        <template #activator="{ attrs: menuAttrs, on: menuOn }">
          <v-btn
            icon
            v-bind="menuAttrs"
            v-on="{ ...ttOn, ...menuOn }"
          >
            <v-icon>mdi-rename</v-icon>
          </v-btn>
        </template>

        <v-card>
          <v-card-text>
            <v-text-field
              :value="props.value"
              :rules="props.rules"
              :label="props.label"
              hide-details="auto"
              class="pt-0"
              @emit="emit('input', $event)"
            />
          </v-card-text>
        </v-card>
      </v-menu>
    </template>

    {{ props.label }}
  </v-tooltip>
</template>

<script setup lang="ts">
const props = defineProps<{
  value: string,
  label: string,
  rules?: ((v: string) => true | string)[],
}>();

const emit = defineEmits<{
  (e: 'input', value: string): void
}>();
</script>
