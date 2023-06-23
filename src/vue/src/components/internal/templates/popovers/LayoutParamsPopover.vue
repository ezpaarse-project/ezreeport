<template>
  <v-menu
    v-if="layout"
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
        {{ $t('title', { index: (layout.at ?? index) + 1 }) }}
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-form v-model="valid">
          <v-row>
            <v-col>
              <!-- Fetcher field -->
              <v-select
                :value="layout.fetcher"
                :label="$t('headers.fetcher')"
                :items="availableFetchers"
                :readonly="readonly"
                placeholder="elastic"
                persistent-placeholder
                @change="onParamUpdate({ fetcher: $event })"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { AnyCustomLayout } from '~/lib/templates/customTemplates';
import useTemplateStore, { transformFetchOptions, type FetchOptions } from '~/stores/template';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    coords: {
      type: Object as PropType<{ x: number, y: number }>,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: true,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    valid: false,

    availableFetchers: ['elastic'],
  }),
  computed: {
    index() {
      return this.templateStore.currentLayouts.findIndex(({ _: { id } }) => id === this.id);
    },
    layout: {
      get(): AnyCustomLayout | undefined {
        return this.templateStore.currentLayouts[this.index];
      },
      set(value: AnyCustomLayout) {
        this.templateStore.UPDATE_LAYOUT(this.id, value);
      },
    },
    /**
     * Fetch options of the layout
     */
    fetchOptions(): FetchOptions & { otherListeners?: Record<string, (e: any) => void> } {
      const opts = transformFetchOptions(this.layout?.fetchOptions);

      if (this.readonly) {
        return opts;
      }

      return {
        ...opts,
        otherListeners: { input: (e: object) => this.onFetchOptionUpdate({ ...e }) },
      };
    },
  },
  methods: {
    onParamUpdate(value: Partial<AnyCustomLayout>) {
      if (!this.layout) {
        return;
      }

      this.layout = {
        ...this.layout,
        ...value,
      };
    },
    onFetchOptionUpdate(value: Record<string, any>) {
      this.onParamUpdate({
        fetchOptions: {
          ...this.layout?.fetchOptions,
          ...value,
        },
      });
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  title: 'Settings for page #{index}'
  headers:
    fetcher: 'Fetcher'
  errors:
    empty: 'This field is required'
fr:
  title: 'Paramètres de la page #{index}'
  headers:
    fetcher: 'Outil de récupération'
  errors:
    empty: 'Ce champ est requis'
</i18n>
