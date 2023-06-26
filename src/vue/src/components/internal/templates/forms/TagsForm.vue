<template>
  <CustomSection :label="$t('headers.tags').toString()">
    <TagPopover
      v-if="currentTag"
      v-model="tagPopoverShown"
      :coords="tagPopoverCoords"
      :tag="currentTag"
      @update:tag="onTagUpdated"
      @delete:tag="onTagDeleted"
    />

    <template #actions>
      <v-tooltip top>
        <template #activator="{ attrs, on }">
          <v-menu offset-y v-bind="attrs" v-on="on">
            <template v-slot:activator="{ on: onMenu, attrs: attrsMenu }">
              <v-btn
                color="success"
                x-small
                icon
                v-bind="{ ...attrs, ...attrsMenu }"
                v-on="{ ...on, ...onMenu }"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </template>

            <v-list>
              <v-list-item
                v-for="tag in actualAvailableTags"
                :key="tag.name"
                @click="onTagAdded(tag)"
              >
                <v-list-item-title>
                  <ReadableChip
                    :color="tag.color"
                    small
                    class="mr-2"
                    style="pointer-events: none;"
                  >
                    {{ tag.name }}
                  </ReadableChip>
                </v-list-item-title>
              </v-list-item>

              <v-divider />

              <v-list-item @click="showTagPopover($event)">
                <v-list-item-title>
                  {{ $t('actions.new-tag') }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>

        <span>{{ $t('actions.add-tag') }}</span>
      </v-tooltip>
    </template>

    <v-chip-group column v-if="value.length > 0">
      <ReadableChip
        v-for="tag in value"
        :key="tag.name"
        :color="tag.color"
        small
        @click="showTagPopover($event, tag)"
      >
        {{ tag.name }}
      </ReadableChip>
    </v-chip-group>
  </CustomSection>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { templates } from '@ezpaarse-project/ezreeport-sdk-js';

export type Tag = templates.FullTemplate['tags'][number];

export default defineComponent({
  props: {
    value: {
      type: Array as PropType<Tag[]>,
      required: true,
    },
    availableTags: {
      type: Array as PropType<Tag[]>,
      default: () => [],
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    input: (value: Tag[]) => !!value,
  },
  data: () => ({
    tagPopoverShown: false,
    tagPopoverCoords: { x: 0, y: 0 },

    currentTag: undefined as Tag | undefined,
  }),
  computed: {
    availableTagMap() {
      const map = new Map<string, Omit<Tag, 'name'>>();
      // eslint-disable-next-line no-restricted-syntax
      for (const { name, ...tag } of this.availableTags) {
        map.set(name, tag);
      }

      return map;
    },
    /**
     * availableTags minus actual tags
     */
    actualAvailableTags(): templates.FullTemplate['tags'] {
      const valueSet = new Set(this.value);
      const availableTags = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const [name, tag] of this.availableTagMap) {
        availableTags.push({ name, ...tag });
      }

      return availableTags.filter((tag) => !valueSet.has(tag));
    },
  },
  methods: {
    /**
     * Show popover for creating/editing tag
     */
    async showTagPopover(e: MouseEvent, tag?: Tag) {
      if (tag) {
        this.currentTag = tag;
      } else {
        this.currentTag = { name: `Tag #${this.value.length || 0}`, color: '' };
        this.$emit('input', [...this.value, this.currentTag]);
      }

      this.tagPopoverCoords = { x: e.clientX, y: e.clientY };
      await this.$nextTick();
      this.tagPopoverShown = true;
    },
    /**
     * When a tag is added
     *
     * @param tag The new tag
     */
    onTagAdded(tag: Tag) {
      this.$emit('input', [...this.value, tag]);
    },
    /**
     * When a tag is updated
     *
     * @param tag The edited tag
     * @param oldName The old name of the tag
     */
    onTagUpdated(tag: Tag, oldName:Tag['name']) {
      const index = this.value.findIndex(({ name }) => oldName === name);
      if (index >= 0) {
        const tags = [...this.value];
        tags.splice(index, 1, tag);
        this.$emit('input', tags);
        this.currentTag = tag;
      }
    },
    /**
     * When a tag is deleted
     *
     * @param tag The deleted tag
     */
    onTagDeleted(tag: Tag) {
      const index = this.value.findIndex(({ name }) => tag.name === name);
      if (index >= 0) {
        const tags = [...this.value];
        tags.splice(index, 1);
        this.$emit('input', tags);
      }
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  headers:
    tags: 'Tags'
  actions:
    add-tag: 'Add tag'
    new-tag: 'Create new tag'
fr:
  headers:
    tags: 'Étiquettes'
  actions:
    add-tag: 'Ajouter une étiquette'
    new-tag: 'Créer une étiquette'
</i18n>
