<template>
  <v-speed-dial
    v-model="open"
    :direction="direction"
    transition="slide-y-reverse-transition"
    style="width: fit-content"
    v-bind="props"
  >
    <template #activator>
      <v-btn
        v-model="open"
        fab
      >
        {{ locale }}
      </v-btn>
    </template>
    <v-btn
      fab
      small
      :color="locale === 'fr' ? 'primary' : undefined"
      @click="locale = 'fr'"
    >
      FR
    </v-btn>
    <v-btn
      fab
      small
      :color="locale === 'en' ? 'primary' : undefined"
      @click="locale = 'en'"
    >
      EN
    </v-btn>
  </v-speed-dial>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

type XDirection = 'right' | 'left';
type YDirection = 'top' | 'bottom';
type Direction = XDirection | YDirection;

export default defineComponent({
  props: {
    direction: {
      type: String as PropType<Direction>,
      default: 'top',
    },
    position: {
      type: String as PropType<`${YDirection}-${XDirection}`>,
      default: 'bottom-left',
    },
  },
  data: () => ({
    open: false,
  }),
  computed: {
    props() {
      const pos = this.position.split('-');
      return {
        [pos[0]]: true,
        [pos[1]]: true,
      };
    },
    locale: {
      get(): string {
        return this.$i18n.locale;
      },
      set(value: string) {
        this.$i18n.locale = value;
      },
    },
  },
});
</script>

<style scoped>

</style>
