<template>
  <v-card
    :title="$t('$ezreeport.editor.filters.title:import')"
    :prepend-icon="mdiFilterMenu"
    variant="flat"
  >
    <template #text>
      <v-row>
        <v-col>
          <p>{{ $t('$ezreeport.editor.filters.description:import') }}</p>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-textarea
            v-model="kibanaText"
            :hint="$t('$ezreeport.editor.filters.foundFilters', filters.length)"
            persistent-hint
            variant="outlined"
            required
          />
        </v-col>
      </v-row>
    </template>

    <template #actions>
      <v-spacer />

      <slot name="actions" />

      <v-btn
        :text="$t('$ezreeport.import')"
        :disabled="filters.length <= 0"
        :prepend-icon="mdiImport"
        color="primary"
        @click="$emit('update:modelValue', filters)"
      />
    </template>
  </v-card>
</template>

<script setup lang="ts">
  import { mdiFilterMenu, mdiImport } from '@mdi/js';
  import { type TemplateFilter, isRawFilter } from '~sdk/helpers/filters';

  // Components events
  defineEmits<{
    /** Imported filters */
    (event: 'update:modelValue', value: TemplateFilter[]): void;
  }>();

  // Utils composables
  const { t } = useI18n();

  /** Text from filters found in Kibana */
  const kibanaText = shallowRef('');

  function generateFilterName(
    filterRef: MaybeRefOrGetter<TemplateFilter>
  ): string {
    const filter = toValue(filterRef);

    // Don't generate name if it's a raw filter
    if (isRawFilter(filter)) {
      return '';
    }

    // We need a field to generate a name
    if (!filter.field) {
      return '';
    }

    // Ensure values are an array
    let values = filter.value ?? '';
    if (!Array.isArray(values)) {
      values = [values];
    }

    // Generate value text
    const valueText = t('$ezreeport.editor.filters.nameTemplate.values', values);
    const data = { field: filter.field, valueText };

    // Generate name
    if (!filter.value) {
      if (filter.isNot) {
        return t('$ezreeport.editor.filters.nameTemplate.exists:not', data);
      }
      return t('$ezreeport.editor.filters.nameTemplate.exists', data);
    }
    if (filter.isNot) {
      return t('$ezreeport.editor.filters.nameTemplate.is:not', data);
    }
    return t('$ezreeport.editor.filters.nameTemplate.is', data);
  }

  /**
   * Filters found in Kibana text
   */
  const filters = computed(() =>
    kibanaText.value
      .split('\n')
      .map((line): TemplateFilter | undefined => {
        const matches = /^(?:(?<invert>NOT)\s)?(?<field>.+): (?<value>.*)/v.exec(
          line
        );
        const { invert, field, value } = matches?.groups ?? {};
        // If no matches, it's not a valid line
        if (!field || !value) {
          return undefined;
        }

        const filter = {
          field,
          isNot: Boolean(invert),
          name: '',
          value,
        };

        // Generate name of the filter
        filter.name = generateFilterName(filter);
        return filter.name ? filter : undefined;
      })
      // oxlint-disable-next-line no-implicit-coercion - Type Guard
      .filter((val) => !!val)
  );
</script>
