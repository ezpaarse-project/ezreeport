<template>
  <v-dialog :value="value" width="500" scrollable @input="$emit('input', $event)">
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
                type="number"
                min="0"
                @input="$emit('update:index', +$event)"
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
                </v-sheet>
              </template>

              <template v-if="layout.fetcher === ''">
                <!-- TODO: choose type of data str/object -->
                <v-textarea
                  :value="layout.data || ''"
                  :label="$t('headers.data')"
                  :rules="rules.data"
                  :readonly="readonly"
                  @blur="$emit('update:layout', { ...layout, data: $event })"
                />
              </template>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { AnyCustomLayout } from './customTemplates';

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
          (v: string) => !Number.isNaN(v) || this.$t('errors.empty'),
        ],
        fetcher: [], // TODO
        data: [], // TODO
      };
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
    data: 'Figures params'
fr:
  title: 'Paramètres de la page #{index}'
  headers:
    position: 'Numéro de page'
    fetcher: 'Outil de récupération'
    fetchOptions: 'Options de récupération'
    data: 'Données des visualisations'
</i18n>
