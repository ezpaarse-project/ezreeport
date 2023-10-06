<template>
  <v-dialog
    v-if="figureParamsForm"
    :value="value"
    :persistent="valid !== true || isChildOpen"
    width="1000"
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-card-title>
        <i18n path="dialog-title" tag="div" class="d-flex align-end" style="width: 50%;">
          <template #title v-if="figure?.type === 'md' || figure?.type === 'metric'">
            {{ figureTitle }}
          </template>
          <template #title v-else>
            <FigureTitleAutocomplete
              :value="figure?.params?.title || ''"
              :readonly="readonly"
              class="ml-2"
              style="flex: 1"
              @input="figureTitle = $event"
            />
          </template>
        </i18n>

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
          icon
          text
          @click="$emit('input', false)"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <!-- Figure params -->
        <v-row>
          <v-col>
            <component
              :is="figureParamsForm"
              :id="id"
              :layout-id="layoutId"
              :readonly="readonly"
              @childOpen="isChildOpen = $event"
              @update:fetchOptions="onFetchOptionUpdate"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { pick } from 'lodash';

import type { AnyCustomFigure } from '~/lib/templates/customTemplates';

import useTemplateStore, { supportedFetchOptions, type FetchOptions, type ValidationResult } from '~/stores/template';

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
  data: () => ({
    isChildOpen: false,
  }),
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
    /**
     * Returns the title of the figure
     */
    figureTitle: {
      get(): string {
        const title = this.figure?.params?.title;
        if (title) {
          return title.toString();
        }

        return this.$t(`$ezreeport.figures.type_list.${this.figure?.type || 'unknown'}`).toString();
      },
      set(title: string) {
        if (!this.figure) {
          return;
        }

        this.templateStore.UPDATE_FIGURE(
          this.layoutId,
          this.id,
          {
            ...this.figure,
            params: {
              ...this.figure.params,
              title,
            },
          },
        );
      },
    },
  },
  methods: {
    async onFetchOptionUpdate(data: Partial<FetchOptions>) {
      if (!this.figure) {
        return;
      }

      this.templateStore.UPDATE_FIGURE(
        this.layoutId,
        this.figure._.id,
        {
          ...this.figure,
          fetchOptions: {
            ...pick(this.figure.fetchOptions ?? {}, supportedFetchOptions),
            ...data,
          },
        },
      );

      // Revalidate
      if (data.fetchCount != null) {
        await this.$nextTick();
        (this.$refs.form as any)?.validate();
      }
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  dialog-title: "{title}'s parameters"
fr:
  dialog-title: 'Paramètres de {title}'
</i18n>
