<template>
  <v-card
    :title="$t('$ezreeport.template.tags.title', modelValue?.size ?? 0)"
    prepend-icon="mdi-tag"
    variant="outlined"
  >
    <template v-if="!readonly" #append>
      <v-menu>
        <template #activator="{ props: menu }">
          <v-btn
            v-tooltip:top="$t('$ezreeport.new')"
            icon="mdi-plus"
            color="green"
            density="compact"
            variant="text"
            class="ml-2"
            v-bind="menu"
          />
        </template>

        <v-progress-linear v-if="loadingTags" color="primary" indeterminate />

        <v-sheet>
          <v-list max-height="265" density="compact" slim>
            <v-list-item
              v-for="tag in availableTags"
              :key="tag.id"
              @click="setTag(tag)"
            >
              <TemplateTagChip :model-value="tag" density="compact" />
            </v-list-item>
          </v-list>

          <v-divider v-if="availableTags.length > 0" />

          <v-list-item
            :title="$t('$ezreeport.template.tags.title:new')"
            prepend-icon="mdi-plus-circle-outline"
            class="my-2"
            @click="openTagForm()"
          />
        </v-sheet>
      </v-menu>
    </template>

    <template v-if="modelValue.size > 0" #text>
      <v-slide-group>
        <v-slide-group-item v-for="[key, tag] in modelValue" :key="key">
          <TemplateTagChip
            v-tooltip:top="{
              enabled: 'id' in tag,
              text: $t('$ezreeport.template.tags.readonly'),
            }"
            :model-value="tag"
            :closable="!readonly"
            :variant="'id' in tag ? 'outlined' : 'flat'"
            class="mr-2"
            @click="openTagForm({ key, tag })"
            @click:close="removeTag(key)"
          />
        </v-slide-group-item>
      </v-slide-group>
    </template>

    <template v-else #text>
      <span class="text-disabled">
        {{ $t('$ezreeport.template.tags.empty') }}
      </span>
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
        :model-value="updatedItem?.tag"
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
import {
  getAllTemplateTags,
  type TemplateTag,
  type InputTemplateTag,
} from '~sdk/template-tags';
import type { TemplateTagMap } from '~sdk/helpers/templates';

type TagWithKey = { key: string; tag: TemplateTag | InputTemplateTag };

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
const isFormVisible = shallowRef(false);
const loadingTags = shallowRef(false);
/** The tag to edit */
const updatedItem = ref<TagWithKey | undefined>();

// Utils composable
// oxlint-disable-next-line id-length
const { t } = useI18n();

/** Tag list */
const availableTags = computedAsync(
  async () => {
    let items: TemplateTag[] = [];

    try {
      ({ items } = await getAllTemplateTags({
        pagination: { count: 0, sort: 'name' },
        include: ['tags'],
      }));
    } catch (err) {
      handleEzrError(t('$ezreeport.template.errors.fetch'), err);
    }

    return items;
  },
  [],
  { evaluating: loadingTags }
);

/**
 * Close the tag form
 */
function closeTagForm(): void {
  isFormVisible.value = false;
}

/**
 * Open the tag form
 *
 * @param item The tag to edit
 */
function openTagForm(item?: TagWithKey): void {
  if (item && 'id' in item.tag) {
    // Prevent edition of existing tags
    return;
  }

  updatedItem.value = item;
  isFormVisible.value = true;
}

/**
 * Upsert the tag
 *
 * @param tag The tag to set
 */
function setTag(tag: TemplateTag | InputTemplateTag): void {
  let key = 'id' in tag ? tag.id : tag.name;
  // Prevent duplication when changing name
  if (updatedItem.value) {
    key = updatedItem.value.key;
  }

  props.modelValue.set(key, tag);
  closeTagForm();
  updatedItem.value = undefined;
  emit('update:modelValue', props.modelValue);
}

/**
 * Delete a tag
 *
 * @param key The tag's key
 */
function removeTag(key: string): void {
  props.modelValue.delete(key);
  emit('update:modelValue', props.modelValue);
}
</script>
