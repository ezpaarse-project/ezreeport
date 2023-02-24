<template>
  <div>
    <ElasticQueryElementPopover
      v-if="selectedQueryElement"
      v-model="elementPopoverShown"
      :coords="elementPopoverCoords"
      :element="selectedQueryElement"
      v-on="elementPopoverListeners"
    />

    <v-chip-group column>
      <v-chip
        v-for="(item, i) in queryChips"
        :key="item.key"
        :color="item.type"
        :close="!isReadonly"
        label
        outlined
        @click="openPopover(i, $event)"
        @click:close="!isReadonly && onChipDeleted(item)"
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

      <v-chip v-if="!isReadonly" icon color="success" @click="onElementCreated">
        <v-icon>mdi-plus</v-icon>
      </v-chip>
    </v-chip-group>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { QueryElement } from './ElasticQueryElementPopover.vue';

type FlattenQueryMap = Map<string, string | number | boolean>;

interface QueryChip {
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
  },
  emits: {
    input: (val: Object) => !!val,
  },
  data: () => ({
    elementPopoverShown: false,
    elementPopoverCoords: { x: 0, y: 0 },

    selectedIndex: -1,
  }),
  computed: {
    /**
     * If component is in readonly mode
     */
    isReadonly() {
      return !this.$listeners.input;
    },
    /**
     * Extract values and some info from Elastic query (value)
     */
    queryElements(): QueryElement[] {
      const flattened = this.flatten(this.value);
      const res: QueryElement[] = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const [key, value] of flattened) {
        const parts = key.split('.');

        const base: Omit<QueryElement, 'values'> = {
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
     * Parse query elements into data for chips
     */
    queryChips(): QueryChip[] {
      return this.queryElements.map((item) => {
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
     * Currently selected query element
     */
    selectedQueryElement(): QueryElement {
      return this.queryElements[this.selectedIndex] || { values: [] };
    },
    /**
     * Listeners for element popover
     */
    elementPopoverListeners() {
      if (this.isReadonly) {
        return {};
      }
      return {
        'update:element': this.onElementEdited,
      };
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
     * Update query value when a element is edited
     *
     * @param element The element
     */
    onElementEdited(element: QueryElement) {
      const elements = [...this.queryElements];
      const index = elements.findIndex(({ raw }) => element.raw === raw);
      if (index < 0) {
        return;
      }

      elements.splice(index, 1, element);
      this.serializeQueryElements(elements);
    },
    /**
     * Update query value when a chip is deleted
     *
     * @param chip The chip
     */
    onChipDeleted(chip: QueryChip) {
      const elements = [...this.queryElements];
      const index = elements.findIndex(({ raw }) => chip.key === raw);
      if (index < 0) {
        return;
      }

      elements.splice(index, 1);
      this.serializeQueryElements(elements);
    },
    /**
     * Update query value when a element is created
     */
    onElementCreated() {
      const index = this.queryElements.length;
      const el: Omit<QueryElement, 'raw'> = {
        key: `field-${index}`,
        modifier: '',
        operator: 'EXISTS',
        values: [''],
      };
      this.serializeQueryElements([el, ...this.queryElements]);
    },
    /**
     * Serialize given element and update query value
     *
     * @param queryElements The new elements
     */
    serializeQueryElements(queryElements: Omit<QueryElement, 'raw'>[]) {
      const query = {
        filter: [] as Record<string, any>[],
        must_not: [] as Record<string, any>[],
      };

      // eslint-disable-next-line no-restricted-syntax
      for (const element of queryElements) {
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
