<template>
  <v-card
    rounded
    outlined
    class="my-2 pa-2"
  >
    <TagPopover
      v-if="currentTag"
      v-model="tagPopoverShown"
      :coords="tagPopoverCoords"
      :tag="currentTag"
      @updated="onTagUpdated"
      @deleted="onTagDeleted"
    />

    <div class="d-flex align-center">
      <span class="text--secondary">{{ $t('headers.tags') }}:</span>

      <v-tooltip top>
        <template #activator="{ attrs, on }">
          <v-menu offset-y v-bind="attrs" v-on="on">
            <template v-slot:activator="{ on: onMenu, attrs: attrsMenu }">
              <v-btn
                color="success"
                small
                icon
                class="ml-1"
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
                  <v-chip
                    :color="tag.color"
                    small
                    class="mr-2"
                    style="pointer-events: none;"
                  >
                    {{ tag.name }}
                  </v-chip>
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
    </div>

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
  </v-card>
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
    /**
     * availableTags minus actual tags
     */
    actualAvailableTags(): templates.FullTemplate['tags'] {
      return this.availableTags.filter(
        (tag) => !this.value.find(({ name }) => tag.name === name),
      );
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
