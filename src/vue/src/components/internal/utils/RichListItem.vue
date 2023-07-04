<template>
  <v-list-item
    two-line
  >
    <v-list-item-avatar :color="!showImage && fallbackIcon ? avatarColor : 'transparent'">
      <img
        v-show="showImage"
        :src="src"
        :alt="alt"
        @error="onImageError"
      />
      <!-- TODO: Fix logo width -->
      <v-icon v-if="!showImage">
        {{ fallbackIcon }}
      </v-icon>
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title>
        <slot name="title">
          {{ title }}
        </slot>
      </v-list-item-title>

      <v-list-item-subtitle
        v-if="subtitle || $slots.subtitle"
        :class="[capitalizeSubtitle && 'text-capitalize']"
      >
        <slot name="subtitle">
          {{ subtitle }}
        </slot>
      </v-list-item-subtitle>
    </v-list-item-content>
  </v-list-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    src: {
      type: String,
      default: '',
    },
    alt: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: '',
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
  data: () => ({
    showImage: true,
  }),
  methods: {
    onImageError() {
      this.showImage = false;
    },
  },
});
</script>

<style scoped>

</style>
