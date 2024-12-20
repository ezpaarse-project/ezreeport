<template>
  <v-card
    :title="modelValue ? $t('$ezreeport.template.tags.title:edit') : $t('$ezreeport.template.tags.title:new')"
    :prepend-icon="modelValue ? 'mdi-tag-edit' : 'mdi-tag-plus'"
  >
    <template #text>
      <v-form ref="formRef" v-model="isValid">
        <v-row>
          <v-col>
            <v-text-field
              v-model="tag.name"
              :label="$t('$ezreeport.name')"
              :rules="[(v) => !!v || $t('$ezreeport.required')]"
              prepend-icon="mdi-rename"
              variant="underlined"
              required
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col class="d-flex justify-center">
            <v-color-picker
              v-model="tag.color"
              mode="hex"
              elevation="0"
            />
            <v-color-picker
              v-model="tag.color"
              mode="hex"
              elevation="0"
              swatches-max-height="230"
              hide-canvas
              hide-inputs
              hide-sliders
              show-swatches
            />
          </v-col>

          <!-- <v-col>
            <v-menu :close-on-content-click="false" location="start" height="350">
              <template #activator="{ props }">
                <v-text-field
                  :model-value="tag.color"
                  :label="$t('$ezreeport.template.tags.color')"
                  prepend-icon="mdi-palette"
                  variant="underlined"
                  readonly
                  v-bind="props"
                >
                  <template #append-inner>
                    <v-badge :color="tag.color" inline />
                  </template>

                  <template v-if="tag.color" #append>
                    <v-btn
                      icon="mdi-close"
                      variant="text"
                      density="comfortable"
                      size="small"
                      @click="tag.color = undefined"
                    />
                  </template>
                </v-text-field>
              </template>

              <v-sheet class="d-flex">
                <v-color-picker
                  v-model="tag.color"
                  mode="hex"
                  elevation="0"
                />
                <v-color-picker
                  v-model="tag.color"
                  mode="hex"
                  elevation="0"
                  swatches-max-height="350"
                  hide-canvas
                  hide-inputs
                  hide-sliders
                  show-swatches
                />
              </v-sheet>
            </v-menu>
          </v-col> -->
        </v-row>
      </v-form>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" />

      <v-btn
        :text="modelValue ? $t('$ezreeport.edit') : $t('$ezreeport.new')"
        :append-icon="modelValue ? 'mdi-pencil' : 'mdi-plus'"
        :disabled="!isValid"
        color="primary"
        @click="$emit('update:modelValue', tag)"
      />
    </template>
  </v-card>
</template>

<script setup lang="ts">
import type { TemplateTag } from '~sdk/helpers/templates';

// Components props
const props = defineProps<{
  /** The tag to show */
  modelValue: TemplateTag | undefined,
}>();

// Components events
defineEmits<{
  /** Updated tag */
  (e: 'update:modelValue', value: TemplateTag): void
}>();

/** Is form valid */
const isValid = ref(false);

/** Filter to edit */
const { cloned: tag } = useCloned<TemplateTag>(props.modelValue ?? { name: '' });

/** Validate on mount */
useTemplateVForm('formRef');
</script>
