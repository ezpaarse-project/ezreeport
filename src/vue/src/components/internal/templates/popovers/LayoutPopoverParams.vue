<template>
  <v-menu
    :value="value"
    :persistent="!valid"
    :position-x="coords.x"
    :position-y="coords.y"
    :close-on-content-click="false"
    absolute
    offset-x
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-card-title>
        {{ $t('title', { index }) }}
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-form v-model="valid">
          <v-row>
            <v-col>
              <v-text-field
                :value="layout.at ?? index"
                :label="$t('headers.position')"
                :readonly="readonly"
                :rules="rules.position"
                type="number"
                min="0"
                @input="onPositionChange"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col>
              <template v-if="!layout.data">
                <v-select
                  :value="layout.fetcher || 'elastic'"
                  :label="$t('headers.fetcher')"
                  :items="availableFetchers"
                  :rules="rules.fetcher"
                  :readonly="readonly"
                  @change="$emit('update:layout', { ...layout, fetcher: $event })"
                />

                <v-sheet
                  rounded
                  outlined
                  class="my-2 pa-2"
                >
                  <ToggleableObjectTree
                    v-if="readonly"
                    :label="$t('headers.fetchOptions').toString()"
                    :value="layout.fetchOptions || {}"
                  />
                  <ToggleableObjectTree
                    v-else
                    :label="$t('headers.fetchOptions').toString()"
                    :value="layout.fetchOptions || {}"
                    @input="
                      !Array.isArray($event)
                        && $emit('update:layout', { ...layout, fetchOptions: $event })
                    "
                  />

                  <v-sheet
                    v-if="layout.fetcher === 'elastic'"
                    rounded
                    outlined
                    class="my-2 pa-2"
                  >
                    <span class="text--secondary">{{ 'Fetcher filters' }}</span>
                    <ElasticQueryBuilder
                      :value="layout.fetchOptions?.filters || {}"
                    />
                  </v-sheet>
                </v-sheet>
              </template>

              <template v-if="layout.fetcher === ''">
                <!-- TODO: choose type of data str/object -->
                <v-textarea
                  :value="layout.data || ''"
                  :label="$t('headers.data')"
                  :rules="rules.data"
                  :readonly="readonly"
                  @blur="onMdChange"
                />
              </template>
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

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    layout: {
      type: Object as PropType<AnyCustomLayout>,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    coords: {
      type: Object as PropType<{ x: number, y: number }>,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: true,
    },
  },
  emits: {
    input: (show: boolean) => show !== undefined,
    'update:layout': (value: AnyCustomLayout) => !!value,
    'update:index': (value: number) => value >= 0,
  },
  data: () => ({
    valid: false,

    availableFetchers: ['', 'elastic'],
  }),
  computed: {
    rules() {
      return {
        position: [
          (v: string) => v !== '' || this.$t('errors.empty'),
          (v: string) => !Number.isNaN(v) || this.$t('errors.valid'),
          (v: string) => +v >= 0 || this.$t('errors.negative'),
        ],
        fetcher: [
          (v: string) => !!v || !!this.layout.data || this.$t('errors.fetcher'),
        ],
        data: [
          (v: string) => !!v || !!this.layout.fetcher || this.$t('errors.fetcher'),
        ],
      };
    },
  },
  methods: {
    onPositionChange(value: string) {
      if (this.rules.position.every((rule) => rule(value) === true)) {
        this.$emit('update:index', +value);
      }
    },
    onMdChange(e: Event) {
      const { value } = e.target as HTMLInputElement;
      if (value !== this.layout.data) {
        this.$emit('update:layout', { ...this.layout, data: value });
      }
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
    position: 'Page number'
    fetcher: 'Fetcher'
    fetchOptions: 'Fetch options'
    data: 'Figures data'
  errors:
    empty: 'This field is required'
    valid: 'The value must be valid'
    negative: 'The value must be positive'
    fetcher: 'A fetcher OR data must be present'
fr:
  title: 'Paramètres de la page #{index}'
  headers:
    position: 'Numéro de page'
    fetcher: 'Outil de récupération'
    fetchOptions: 'Options de récupération'
    data: 'Données des visualisations'
  errors:
    empty: 'Ce champ est requis'
    valid: 'La valeur doit être valide'
    negative: 'La valeur doit être positive'
    fetcher: 'Un outil de récupération OU des données doivent être présentes'
</i18n>
