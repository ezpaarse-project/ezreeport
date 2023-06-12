<template>
  <v-menu
    :value="value"
    :position-x="coords.x"
    :position-y="coords.y"
    :close-on-content-click="false"
    absolute
    offset-y
    max-width="450"
    min-width="450"
    @input="$emit('input', $event)"
  >
    <v-card v-if="tagValue">
      <v-card-title>
        <v-text-field
          v-model="tagValue.name"
          :label="$t('headers.name')"
        />

        <v-spacer />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text style="position: relative">
        <v-menu
          :close-on-content-click="false"
          transition="fade-transition"
          min-width="auto"
        >
          <template #activator="{ attrs, on }">
            <v-text-field
              :label="$t('headers.color')"
              :value="tagValue.color"
              readonly
              v-bind="attrs"
              v-on="on"
            >
              <template #prepend>
                <v-chip :color="tagValue.color" small />
              </template>
            </v-text-field>
          </template>

          <v-color-picker
            v-model="tagValue.color"
          />
        </v-menu>

      </v-card-text>

      <v-card-actions>
        <v-btn
          color="error"
          @click="onDelete">
          {{ $t('actions.delete') }}
        </v-btn>

        <v-spacer />

        <v-btn
          color="success"
          @click="onConfirm"
        >
          {{ $t('actions.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { cloneDeep } from 'lodash';
import { defineComponent, type PropType } from 'vue';
import { Tag } from '../forms/TagsForm.vue';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    tag: {
      type: Object as PropType<Tag>,
      required: true,
    },
    coords: {
      type: Object as PropType<{ x: number, y: number }>,
      required: true,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
    updated: (tag: Tag, oldName: Tag['name']) => !!tag && !!oldName,
    deleted: (tag: Tag) => !!tag,
  },
  data: () => ({
    tagValue: undefined as Tag | undefined,
  }),
  watch: {
    value(val: boolean) {
      if (val) {
        this.tagValue = cloneDeep(this.tag);
      }
    },
  },
  methods: {
    onDelete() {
      if (this.tagValue) {
        this.$emit('deleted', this.tagValue);
        this.$emit('input', false);
      }
    },
    onConfirm() {
      if (this.tagValue) {
        this.$emit('updated', this.tagValue, this.tag.name);
        this.$emit('input', false);
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
    name: 'Name'
    color: 'Color'
  actions:
    delete: 'Delete'
    confirm: 'Confirm'
fr:
  headers:
    name: 'Nom'
    color: 'Couleur'
  actions:
    delete: 'Supprimer'
    confirm: 'Confirmer'
</i18n>
