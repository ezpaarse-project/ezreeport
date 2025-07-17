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
        <v-slide-group-item v-for="[key, tag] in modelValue" :key="key">
          <TemplateTagChip
            :model-value="tag"
            :closable="!readonly"
            class="mr-2"
            @click="openTagForm({ key, tag })"
            @click:close="deleteTag(key)"
          />
        </v-slide-group-item>
      </v-slide-group>
    </template>

    <template v-else #text>
      <span class="text-disabled">{{
        $t('$ezreeport.template.tags.empty')
      }}</span>
    </template>

    <v-menu
      v-if="!readonly"
      :model-value="isFormVisible"
      :close-on-content-click="false"
      target="parent"
      min-width="650"
      max-width="650"
      @update:model-value="$event || closeTagForm()"
    >
      <TemplateTagForm
        :model-value="updatedTag?.tag"
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

type TagWithKey = { key: string; tag: TemplateTag };

// Components props
const props = defineProps<{
  /** The tags */
  modelValue: TemplateTagMap;
  /** Should be readonly */
  readonly?: boolean;
}>();

// Components events
const emit = defineEmits<{
  /** Updated tags */
  (event: 'update:modelValue', value: TemplateTagMap): void;
}>();

/** Should show the tag form */
const isFormVisible = ref(false);
/** The tag to edit */
const updatedTag = ref<TagWithKey | undefined>();

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
function openTagForm(tag?: TagWithKey) {
  updatedTag.value = tag;
  isFormVisible.value = true;
}

/**
 * Upsert the tag
 *
 * @param tag The tag to set
 */
function setTag(tag: TemplateTag) {
  props.modelValue.set(updatedTag.value?.key ?? tag.name, tag);
  closeTagForm();
  updatedTag.value = undefined;
  emit('update:modelValue', props.modelValue);
}

/**
 * Delete a tag
 *
 * @param key The tag's key
 */
function deleteTag(key: string) {
  props.modelValue.delete(key);
  emit('update:modelValue', props.modelValue);
}
</script>
