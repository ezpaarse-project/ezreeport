<template>
  <div
    :classes="[
      expand && 'v-input--expand',
      reverse && 'v-input--reverse',
    ]"
  >
    <v-switch
      :input-value="value"
      :readonly="readonly"
      :label="label"
      :disabled="disabled"
      @change="$emit('input', $event)"
      @click="$emit('click', $event)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  emits: {
    input: (value: boolean) => value !== undefined,
    click: (event: MouseEvent) => !!event,
  },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    reverse: {
      type: Boolean,
      default: false,
    },
    expand: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: '',
    },
  },
});
</script>

<style lang="scss" scoped>
// Source: https://github.com/vuetifyjs/vuetify/issues/7283#issuecomment-572276385

// Reversed input variant
.v-input--reverse .v-input__slot {
  flex-direction: row-reverse;
  justify-content: flex-end;

  .v-application--is-ltr & {
    .v-input--selection-controls__input {
      margin-right: 0;
      margin-left: 8px;
    }
  }

  .v-application--is-rtl & {
    .v-input--selection-controls__input {
      margin-left: 0;
      margin-right: 8px;
    }
  }

  .v-label {
    flex: unset;
  }
}

// Expand input variant
.v-input--expand .v-input__slot {
  .v-label {
    display: block;
    flex: 1;
  }
}
</style>
