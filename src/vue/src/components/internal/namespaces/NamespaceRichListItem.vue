<template>
  <RichListItem
    :title="namespace.name"
    :src="src"
    :alt="alt"
    :fallback-icon="$ezReeport.data.namespaces.icon"
    capitalize-subtitle
  >
    <template #subtitle>
      <v-chip v-if="showTaskCount" x-small outlined class="mr-1">
        {{ $tc('taskCount', namespace._count?.tasks || 0) }}
      </v-chip>
      <v-chip v-if="showMembersCount" x-small outlined class="mr-1">
        {{ $tc('memberCount', namespace._count?.memberships || 0) }}
      </v-chip>
    </template>
  </RichListItem>
</template>

<script lang="ts">
import type { namespaces } from '@ezpaarse-project/ezreeport-sdk-js';
import { defineComponent, PropType } from 'vue';
import ezReeportMixin from '~/mixins/ezr';

type NamespaceWithCount = namespaces.Namespace & {
  _count?: {
    tasks?: number,
    memberships?: number,
  }
};

export default defineComponent({
  mixins: [ezReeportMixin],
  props: {
    namespace: {
      type: Object as PropType<NamespaceWithCount>,
      required: true,
    },
    showTaskCount: {
      type: Boolean,
      default: false,
    },
    showMembersCount: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    alt(): string {
      return this.$t('alt', { name: this.namespace.name }).toString();
    },
    src(): string | undefined {
      if (!this.namespace.logoId) {
        return undefined;
      }

      try {
        return new URL(this.namespace.logoId, this.$ezReeport.data.namespaces.logoUrl).href;
      } catch (error) {
        return undefined;
      }
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  alt: "{name}'s logo"
  taskCount: '{n} reports'
  memberCount: '{n} members'
fr:
  alt: 'logo de {name}'
  taskCount: '{n} rapport|{n} rapports'
  memberCount: '{n} membre|{n} membres'
</i18n>
