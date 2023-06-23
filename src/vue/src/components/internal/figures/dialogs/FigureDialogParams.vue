<template>
  <v-dialog
    v-if="figureParamsForm"
    :value="value"
    :persistent="valid !== true"
    width="1000"
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-card-title>
        {{ $t('title', { title: dialogTitle }) }}

        <div v-if="figure" class="ml-1">
          <v-tooltip top v-if="valid !== true" color="warning">
            <template #activator="{ attrs, on }">
              <v-icon
                color="warning"
                small
                v-bind="attrs"
                v-on="on"
              >
                mdi-alert
              </v-icon>
            </template>

            <span>{{ valid }}</span>
          </v-tooltip>
        </div>

        <v-spacer />

        <v-btn
          :disabled="valid !== true"
          icon
          text
          @click="$emit('input', false)"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <component
          :is="figureParamsForm"
          :id="id"
          :layout-id="layoutId"
          :readonly="readonly"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { AnyCustomFigure } from '~/lib/templates/customTemplates';
import useTemplateStore, { type ValidationResult } from '~/stores/template';
import figureFormMap from '../types/forms';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    id: {
      type: String,
      required: true,
    },
    layoutId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  computed: {
    layout() {
      return this.templateStore.currentLayouts.find(
        ({ _: { id } }) => id === this.layoutId,
      );
    },
    figure(): AnyCustomFigure | undefined {
      return this.layout?.figures.find(({ _: { id } }) => id === this.id);
    },
    figureIndex(): number | undefined {
      return this.layout?.figures.findIndex(({ _: { id } }) => id === this.id);
    },
    valid() {
      let valid: ValidationResult = true;
      if (this.figure?.type !== 'md' && this.layout?._.valid) {
        valid = this.layout._.valid;
      }

      if (this.figure && this.figure._.valid !== true) {
        valid = this.figure._.valid;
      }

      if (valid === true) {
        return true;
      }
      let err = this.$t(valid.i18nKey);
      if (valid.field) {
        err += ` (${valid.field})`;
      }
      return err;
    },
    /**
     * Returns the title of the figure
     */
    dialogTitle() {
      const title = this.figure?.params?.title;
      if (title) {
        return title;
      }

      return this.$t(`$ezreeport.figures.types.${this.figure?.type || 'unknown'}`);
    },
    /**
     * Components that holds figure params
     */
    figureParamsForm() {
      if (!this.figure) {
        return undefined;
      }

      const component = figureFormMap[this.figure.type];
      if (component !== undefined) {
        return component;
      }
      // eslint-disable-next-line no-underscore-dangle
      return figureFormMap._default;
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  title: "{title}'s parameters"
fr:
  title: 'Paramètres de {title}'
</i18n>
../../figures/forms
../../figures/types/forms
