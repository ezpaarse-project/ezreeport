<template>
  <v-card
    :title="
      modelValue
        ? $t('$ezreeport.template.tags.title:edit')
        : $t('$ezreeport.template.tags.title:new')
    "
    :prepend-icon="modelValue ? mdiTagEdit : mdiTagPlus"
  >
    <template #text>
      <v-form ref="formRef" v-model="isValid">
        <v-row>
          <v-col>
            <v-text-field
              v-model="tag.name"
              :label="$t('$ezreeport.name')"
              :rules="[(val) => !!val || $t('$ezreeport.required')]"
              :prepend-icon="mdiRename"
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
              class="elevation-0"
            />
            <v-color-picker
              v-model="tag.color"
              mode="hex"
              swatches-max-height="230"
              hide-canvas
              hide-inputs
              hide-sliders
              show-swatches
              class="elevation-0"
            />
          </v-col>
        </v-row>
      </v-form>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" />

      <v-btn
        :text="$t('$ezreeport.confirm')"
        :append-icon="modelValue ? mdiPencil : mdiPlus"
        :disabled="!isValid"
        color="primary"
        @click="$emit('update:modelValue', tag)"
      />
    </template>
  </v-card>
</template>

<script setup lang="ts">
  import type { InputTemplateTag, TemplateTag } from '~sdk/template-tags';
  import { mdiPencil, mdiPlus, mdiRename, mdiTagEdit, mdiTagPlus } from '@mdi/js';

  // Components props
  const props = defineProps<{
    /** The tag to show */
    modelValue: TemplateTag | InputTemplateTag | undefined;
  }>();

  // Components events
  defineEmits<{
    /** Updated tag */
    (event: 'update:modelValue', value: TemplateTag | InputTemplateTag): void;
  }>();

  /** Is form valid */
  const isValid = shallowRef(false);

  /** Filter to edit */
  const { cloned: tag } = useCloned<TemplateTag | InputTemplateTag>(
    props.modelValue ?? { name: '' }
  );

  /** Validate on mount */
  useTemplateVForm('formRef', { immediate: Boolean(props.modelValue) });
</script>
