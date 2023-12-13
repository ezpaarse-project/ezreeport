<template>

  <div class="preview" v-if="layouts.length > 0">
    <div
      v-for="(layout, i) in layouts"
      :key="layout._.id"
      class="d-flex"
    >
      <!-- Header -->
      <div class="layout-header">
        <span style="font-size: 1.25em;">
          {{ i + 1 }}
        </span>
      </div>

      <!-- Layout -->
      <v-hover>
        <template #default="{ hover }">
          <v-sheet
            rounded
            outlined
            class="layout-preview mb-3 pa-2"
            @click="$emit('input', layout._.id)"
          >
            <SlotItemGrid
              :items="layout.figures"
              :grid="grid"
            >
              <template #item="{ item: figure }">
                <v-sheet
                  class="figure-preview"
                  rounded
                  outlined
                >
                  <v-icon :large="layout.figures.length <= 2">
                    {{ figureIcons[figure.type] || 'mdi-help' }}
                  </v-icon>
                </v-sheet>
              </template>
            </SlotItemGrid>

            <!-- Actions -->
            <v-fade-transition>
              <v-overlay
                v-if="hover"
                absolute
                :color="`grey ${!$vuetify.theme.dark ? 'darken-3' : ''}`"
              />
            </v-fade-transition>
          </v-sheet>
        </template>
      </v-hover>
    </div>
  </div>
  <div class="empty" v-else>
    {{ $t('no_data') }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { templates } from '@ezpaarse-project/ezreeport-sdk-js';
import { addAdditionalDataToLayouts } from '~/lib/templates/customTemplates';
import { figureIcons } from '~/lib/templates/figures';

const props = defineProps<{
  layouts: templates.Layout[],
  name?: string,
  grid?: { cols: number, rows: number }
}>();

const layouts = computed(() => addAdditionalDataToLayouts(props.layouts));
</script>

<style scoped lang="scss">
.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 10rem;
}

.preview {
  $cols: 4;

  display: grid;
  grid-template-columns: repeat($cols, 1fr);
  grid-auto-rows: 1fr;

  & > div {
    padding: 1.5rem;

    &:nth-last-of-type(n + #{$cols + 1}) {
      border-bottom: 1px solid currentColor;
    }
  }
}

.layout-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;

  margin-right: 0.25rem;
  min-width: 16px;
}

.layout-preview {
  flex: 1;
  overflow: hidden;

  position: relative;
  align-items: center;
  justify-content: center;

  aspect-ratio: 297/210; // A4 format in mm

  transition: background-color 0.5s, border-color 0.5s;

  > * {
    height: 100%;
  }

  .figure-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
}
</style>

<i18n lang="yaml">
en:
  no_data: 'No page'
fr:
  no_data: 'Aucune page'
</i18n>
