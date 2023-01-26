<template>
  <v-menu
    ref="menu"
    :close-on-content-click="false"
    transition="fade-transition"
    min-width="auto"
  >
    <template #activator="{ on, attrs }">
      <v-text-field
        :value="formatedDate"
        :label="label"
        :solo="solo"
        :filled="filled"
        :outlined="outlined"
        :prepend-icon="icon"
        readonly
        v-bind="attrs"
        v-on="on"
      >
        <template #append-outer>
          <slot name="append" />
        </template>
      </v-text-field>
    </template>
    <v-date-picker
      v-model="date"
      :locale="$i18n.locale"
      :max="maxDate"
      :min="minDate"
      :events="eventDates"
      :event-color="eventColor"
      :color="color"
      :range="Array.isArray(date)"
      first-day-of-week="1"
      show-current
      show-adjacent-months
      @change="saveDate"
    />
  </v-menu>
</template>

<script lang="ts">
import { format, parse } from 'date-fns';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  props: {
    value: {
      type: [Date, Array] as PropType<Date | [Date, Date]>,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    min: {
      type: Date as PropType<Date | undefined>,
      default: undefined,
    },
    max: {
      type: Date as PropType<Date | undefined>,
      default: undefined,
    },
    events: {
      type: Array as PropType<Date[] | undefined>,
      default: undefined,
    },
    eventColor: {
      type: String,
      default: 'primary',
    },
    color: {
      type: String,
      default: 'primary',
    },
    icon: {
      type: String,
      default: 'mdi-calendar',
    },
    solo: {
      type: Boolean,
      default: undefined,
    },
    filled: {
      type: Boolean,
      default: undefined,
    },
    outlined: {
      type: Boolean,
      default: undefined,
    },
  },
  emits: {
    input: (value: Date | [Date, Date]) => !!value,
  },
  computed: {
    /**
     * The value for DatePicker
     */
    date: {
      get(): string | string[] {
        return Array.isArray(this.value)
          ? this.value.map(this.formatDate)
          : this.formatDate(this.value);
      },
      set(value: string | string[]) {
        const val: Date | Date[] = Array.isArray(value)
          ? value.map(this.parseDate)
          : this.parseDate(value);
        this.$emit('input', val as [Date, Date]);
      },
    },
    /**
     * Minimum date for DatePicker
     */
    minDate(): string | undefined {
      return this.min && this.formatDate(this.min);
    },
    /**
     * Maximum date for DatePicker
     */
    maxDate(): string | undefined {
      return this.max && this.formatDate(this.max);
    },
    /**
     * The events for DatePicker
     */
    eventDates(): string[] | undefined {
      return this.events && this.events.map(this.formatDate);
    },
    /**
     * The value for TextField
     */
    formatedDate(): string {
      return Array.isArray(this.value)
        ? this.value.map((v) => v.toLocaleDateString()).join(' - ')
        : this.value.toLocaleDateString();
    },
  },
  methods: {
    parseDate(date: string) {
      return parse(date, 'yyyy-MM-dd', new Date());
    },
    formatDate(date: Date) {
      return format(date, 'yyyy-MM-dd');
    },
    saveDate(date: string) {
      if (
        this.$refs.menu
        && 'save' in this.$refs.menu
        && typeof this.$refs.menu.save === 'function'
      ) {
        this.$refs.menu.save(date);
      }
    },
  },
});
</script>

<style scoped>

</style>
