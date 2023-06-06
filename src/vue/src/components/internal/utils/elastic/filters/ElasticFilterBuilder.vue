<template>
  <div v-if="filterChips.length > 0">
    <ElasticFilterElementPopover
      v-if="selectedFilterElement"
      v-model="elementPopoverShown"
      :coords="elementPopoverCoords"
      :element="selectedFilterElement"
      :readonly="readonly"
      @update:element="onElementEdited"
    />

    <v-chip-group column>
      <v-chip
        v-for="(item, i) in filterChips"
        :key="item.key"
        :color="item.type"
        :close="!readonly"
        label
        outlined
        @click="openPopover(i, $event)"
        @click:close="!readonly && onElementDeleted(item)"
      >
        <i18n :path="item.i18n" tag="span">
          <template #key>
            <span class="text--primary font-italic">
              {{ item.data.key }}
            </span>
          </template>

          <template #value>
            <span class="text--primary">
              {{ item.data.value }}
            </span>
          </template>

        </i18n>
      </v-chip>
    </v-chip-group>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { FilterElement } from './ElasticFilterElementPopover.vue';

type FlattenQueryMap = Map<string, string | number | boolean>;

interface FilterChip {
  key: string;
  type: string;
  i18n: string;
  data: {
    key: string;
    value: string;
  };
}

export default defineComponent({
  props: {
    value: {
      type: Object,
      required: true,
    },
    readonly: {
      type: Boolean,
      required: false,
    },
  },
  emits: {
    input: (val: Record<string, any>) => !!val,
  },
  data: () => ({
    elementPopoverShown: false,
    elementPopoverCoords: { x: 0, y: 0 },

    selectedIndex: -1,
  }),
  computed: {
    /**
     * Extract values and some info from Elastic query (value)
     */
    filterElements(): FilterElement[] {
      const flattened = this.flatten(this.value);
      const res: FilterElement[] = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const [key, value] of flattened) {
        const parts = key.split('.');

        const base: Omit<FilterElement, 'values'> = {
          raw: key,
          modifier: '',
          operator: 'IS',
          key: parts.at(-1) ?? '',
        };

        // Check negations
        if (parts[0] === 'must_not') {
          base.modifier = 'NOT';
        }

        // Check if operator is exist
        if (parts[2] === 'exists') {
          base.operator = 'EXISTS';
          base.key = value.toString();
        }

        // If already matched...
        const existingIndex = res.findIndex(
          (el) => el.key === base.key && el.modifier === base.modifier,
        );
        if (existingIndex >= 0) {
          // ...add it to the list of values
          if (res[existingIndex].operator !== 'EXISTS') {
            res[existingIndex].values.push(value);
          }
        } else {
          // ...else add into res
          res.push({
            ...base,
            values: [value],
          });
        }
      }

      return res.sort((a, b) => a.key.localeCompare(b.key));
    },
    /**
     * Parse filters elements into data for chips
     */
    filterChips(): FilterChip[] {
      return this.filterElements.map((item) => {
        let type = 'info';
        switch (item.modifier) {
          case 'NOT':
            type = 'error';
            break;

          default:
            break;
        }

        const operator = item.values.length > 1 ? 'IN' : item.operator;
        return {
          key: item.raw,
          type,
          i18n: `operatorsFormatters.${operator}_${item.modifier}`,
          data: {
            key: item.key,
            value: item.values.join(', '),
          },
        };
      });
    },
    /**
     * Currently selected filter element
     */
    selectedFilterElement(): FilterElement {
      return this.filterElements[this.selectedIndex] || { values: [] };
    },
  },
  methods: {
    /**
     * Recursively set values of a map following nested object
     *
     * Based on https://stackoverflow.com/a/34514143
     *
     * @param currentNode current node of the nested object
     * @param target the current state of the map
     * @param flattenedKey the previous keys
     */
    traverseAndFlatten(
      currentNode: Record<string, any>,
      target: FlattenQueryMap,
      flattenedKey?: string,
    ) {
      // eslint-disable-next-line no-restricted-syntax
      for (const [key, value] of Object.entries(currentNode)) {
        let newKey;
        if (flattenedKey === undefined) {
          newKey = key;
        } else {
          newKey = `${flattenedKey}.${key}`;
        }

        if (typeof value === 'object') {
          this.traverseAndFlatten(value, target, newKey);
        } else {
          target.set(newKey, value);
        }
      }
    },
    /**
     * Flatten nested object into a ES6 Map
     *
     * Based on https://stackoverflow.com/a/34514143
     *
     * @param obj nested object
     *
     * @returns The Map
     */
    flatten(obj: Object): FlattenQueryMap {
      const flattenedMap = new Map<string, string | number | boolean>();
      this.traverseAndFlatten(obj, flattenedMap);
      return flattenedMap;
    },
    /**
     * Prepare and open element popover
     *
     * @param index the index of chip
     * @param event The base event
     */
    async openPopover(i: number, event: MouseEvent) {
      this.selectedIndex = i;
      this.elementPopoverCoords = {
        x: event.clientX,
        y: event.clientY,
      };
      await this.$nextTick();
      this.elementPopoverShown = true;
    },
    /**
     * Update filter value when a element is edited
     *
     * @param element The element
     */
    onElementEdited(element: FilterElement) {
      const elements = [...this.filterElements];
      const index = elements.findIndex(({ raw }) => element.raw === raw);
      if (index < 0) {
        return;
      }

      elements.splice(index, 1, element);
      this.serializeFilterElements(elements);
    },
    /**
     * Update filter value when a element is deleted
     *
     * @param element The element
     */
    onElementDeleted(element: FilterChip) {
      const elements = [...this.filterElements];
      const index = elements.findIndex(({ raw }) => element.key === raw);
      if (index < 0) {
        return;
      }

      elements.splice(index, 1);
      this.serializeFilterElements(elements);
    },
    /**
     * Update filter value when a element is created
     *
     * Note: called by parent via ref
     */
    onElementCreated() {
      const index = this.filterElements.length;
      const el: Omit<FilterElement, 'raw'> = {
        key: `field-${index}`,
        modifier: '',
        operator: 'EXISTS',
        values: [''],
      };
      this.serializeFilterElements([el, ...this.filterElements]);
    },
    /**
     * Serialize given element and update filter value
     *
     * @param filterElements The new elements
     */
    serializeFilterElements(filterElements: Omit<FilterElement, 'raw'>[]) {
      const query = {
        filter: [] as Record<string, any>[],
        must_not: [] as Record<string, any>[],
      };

      // eslint-disable-next-line no-restricted-syntax
      for (const element of filterElements) {
        // Prepare value
        const values = element.values.map((val) => ({
          [element.key]: val,
        }));

        // Find correct type of filter
        let type: string;
        switch (typeof element.values[0]) {
          // TODO
          // case 'string':
          //   type = ''
          //   break;

          default:
            type = 'match_phrase';
            break;
        }

        // Prepare filter
        const filter: Record<string, any> = {};
        switch (element.operator) {
          case 'EXISTS':
            [filter.exists] = values.map(() => ({ field: element.key }));
            break;

          default:
            if (values.length <= 1) {
              [filter[type]] = values;
            } else {
              filter.bool = {
                should: values.map((el) => ({ [type]: el })),
              };
            }
            break;
        }

        // Add filter to query
        switch (element.modifier) {
          case 'NOT':
            query.must_not.push(filter);
            break;

          default:
            query.filter.push(filter);
            break;
        }
      }

      this.$emit('input', query);
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  operatorsFormatters:
    IS_: '{key} is {value}'
    IS_NOT: '{key} is not {value}'
    IN_: '{key} is in {value}'
    IN_NOT: '{key} is not in {value}'
    EXISTS_: '{key} exist'
    EXISTS_NOT: "{key} doesn't exist"
fr:
  operatorsFormatters:
    IS_: '{key} est {value}'
    IS_NOT: "{key} n'est pas {value}"
    IN_: '{key} est inclus dans {value}'
    IN_NOT: "{key} n'est pas inclus dans {value}"
    EXISTS_: '{key} existe'
    EXISTS_NOT: "{key} n'existe pas"
</i18n>
