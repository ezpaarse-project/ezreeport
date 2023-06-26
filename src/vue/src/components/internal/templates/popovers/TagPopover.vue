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
    <v-card>
      <v-card-title>
        <v-text-field
          v-model="innerName"
          :label="$t('headers.name')"
          :rules="rules.name"
          @blur="updateTag({ name: innerName })"
        />

        <v-spacer />

        <v-btn icon text @click="$emit('input', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text style="position: relative">
        <v-form v-model="valid">
          <v-menu
            :close-on-content-click="false"
            transition="fade-transition"
            min-width="auto"
          >
            <template #activator="{ attrs, on }">
              <v-text-field
                :label="$t('headers.color')"
                :value="tag.color || defaultColor"
                :rules="rules.color"
                readonly
                v-bind="attrs"
                v-on="on"
              >
                <template #prepend>
                  <v-chip :color="tag.color" small />
                </template>
              </v-text-field>
            </template>

            <v-color-picker
              :value="tag.color || defaultColor"
              @input="updateTag({ color: $event })"
            />
          </v-menu>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-btn
          color="error"
          @click="onDelete"
        >
          {{ $t('actions.delete') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { Tag } from '../forms/TagsForm.vue';

const hexRegex = /^#[0-9A-F]{3}([0-9A-F]{3})?([0-9A-F]{2})?$/i;

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
    'update:tag': (tag: Tag, oldName: Tag['name']) => !!tag && !!oldName,
    'delete:tag': (tag: Tag) => !!tag,
  },
  data: () => ({
    innerValid: false,
    innerName: '',
  }),
  computed: {
    rules() {
      return {
        name: [
          (v: string) => !!v || this.$t('$ezreeport.errors.empty'),
        ],
        color: [
          (v?: string) => !v || hexRegex.test(v) || this.$t('errors.hex_format'),
        ],
      };
    },
    /**
     * Form validation state + name validation, which is outside of form
     */
    valid: {
      get(): boolean {
        return this.innerValid
          && this.rules.name.every((rule) => rule(this.innerName) === true);
      },
      set(value: boolean) {
        this.innerValid = value;
      },
    },
    defaultColor() {
      if (this.$vuetify.theme.dark) {
        return '#555555';
      }
      return '#E0E0E0';
    },
  },
  watch: {
    value(val: boolean) {
      if (val) {
        this.innerName = this.tag.name;
      }
    },
  },
  methods: {
    updateTag(data: Partial<Tag>) {
      if (!this.valid) {
        return;
      }

      // Removing value if default of vuetify
      const defaultColorRegex = new RegExp(`^${this.defaultColor}(FF)?$`, 'i');
      if (data.color && defaultColorRegex.test(data.color)) {
        // eslint-disable-next-line no-param-reassign
        data.color = undefined;
      }

      this.$emit(
        'update:tag',
        {
          ...this.tag,
          ...data,
        },
        this.tag.name,
      );
    },
    onDelete() {
      this.$emit('delete:tag', this.tag);
      this.$emit('input', false);
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
  errors:
    hex_format: 'HEX_FORMAT'
fr:
  headers:
    name: 'Nom'
    color: 'Couleur'
  actions:
    delete: 'Supprimer'
    confirm: 'Confirmer'
  errors:
    hex_format: 'HEX_FORMAT'
</i18n>
