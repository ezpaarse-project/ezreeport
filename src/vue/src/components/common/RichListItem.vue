<template>
  <v-list-item
    two-line
  >
    <v-list-item-avatar :color="!showImage && fallbackIcon ? avatarColor : 'transparent'">
      <v-img
        v-show="showImage"
        ref="img"
        :src="src"
        :alt="alt"
      />
      <v-icon v-if="!showImage">
        {{ fallbackIcon }}
      </v-icon>
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title>{{ title }}</v-list-item-title>
      <v-list-item-subtitle
        v-if="subtitle"
        :class="[capitalizeSubtitle && 'text-capitalize']"
      >
        {{ subtitle }}
      </v-list-item-subtitle>
    </v-list-item-content>
  </v-list-item>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { VImg } from 'vuetify/lib';

export default defineComponent({
  props: {
    src: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    alt: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    capitalizeSubtitle: {
      type: Boolean,
      default: false,
    },
    fallbackIcon: {
      type: String,
      default: 'mdi-image-off',
    },
    avatarColor: {
      type: String,
      default: 'grey',
    },
  },
  computed: {
    showImage(): boolean {
      const img = this.$refs.img as InstanceType<typeof VImg> | undefined;
      return !!this.src && !img?.$data.hasError;
    },
  },
});
</script>

<style scoped>

</style>
