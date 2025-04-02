<template>
  <v-card
    :title="$t('$ezreeport.template.tags.title', modelValue?.size ?? 0)"
    prepend-icon="mdi-tag"
    variant="outlined"
  >
    <template v-if="!readonly" #append>
      <v-btn
        v-tooltip:top="$t('$ezreeport.new')"
        icon="mdi-plus"
        color="green"
        density="compact"
        variant="text"
        class="ml-2"
        @click="openTagForm()"
      />
    </template>

    <template v-if="modelValue.size > 0" #text>
      <v-slide-group>
        <v-slide-group-item
          v-for="[name, tag] in modelValue"
          :key="name"
        >
          <TemplateTagChip
            :model-value="tag"
            :closable="!readonly"
            class="mr-2"
            @click="openTagForm(tag)"
            @click:close="deleteTag(tag)"
          />
        </v-slide-group-item>
      </v-slide-group>
    </template>

    <template v-else #text>
      <span class="text-disabled">{{ $t('$ezreeport.template.tags.empty') }}</span>
    </template>

    <v-menu
      v-if="!readonly"
      :model-value="isFormVisible"
      :close-on-content-click="false"
      target="parent"
      @update:model-value="$event || closeTagForm()"
    >
      <TemplateTagForm
        :model-value="updatedTag"
        width="650px"
        @update:model-value="setTag($event)"
      >
        <template #actions>
          <v-btn :text="$t('$ezreeport.cancel')" @click="closeTagForm()" />
        </template>
      </TemplateTagForm>
    </v-menu>
  </v-card>
</template>

<script setup lang="ts">
import type { TemplateTagMap, TemplateTag } from '~sdk/helpers/templates';

// Components props
const props = defineProps<{
  /** The tags */
  modelValue: TemplateTagMap,
  /** Should be readonly */
  readonly?: boolean,
}>();

// Components events
const emit = defineEmits<{
  /** Updated tags */
  (e: 'update:modelValue', value: TemplateTagMap): void,
}>();

/** Should show the tag form */
const isFormVisible = ref(false);
/** The tag to edit */
const updatedTag = ref<TemplateTag | undefined>();

/**
 * Close the tag form
 */
function closeTagForm() {
  isFormVisible.value = false;
}

/**
 * Open the tag form
 *
 * @param tag The tag to edit
 */
function openTagForm(tag?: TemplateTag) {
  updatedTag.value = tag;
  isFormVisible.value = true;
}

/**
 * Upsert the tag
 *
 * @param tag The tag to set
 */
function setTag(tag: TemplateTag) {
  props.modelValue.set(tag.name, tag);
  closeTagForm();
  updatedTag.value = undefined;
  emit('update:modelValue', props.modelValue);
}

/**
 * Delete a tag
 *
 * @param tag The tag
 */
function deleteTag(tag: TemplateTag) {
  props.modelValue.delete(tag.name);
  emit('update:modelValue', props.modelValue);
}
</script>
