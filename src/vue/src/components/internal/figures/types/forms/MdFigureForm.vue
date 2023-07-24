<template>
  <v-row v-if="figure" class="py-2 md-container">
    <v-col class="md-preview">
      <div>
        {{ $t('headers.preview') }}
      </div>

      <v-sheet
        light
        rounded
        outlined
        class="pl-3 fill-height"
        style="position: relative; border-color: rgba(0, 0, 0, 0.38);"
      >
        <div v-html="renderedMD" class="md-content" />
      </v-sheet>
    </v-col>

    <v-col>
      <div>
        {{ $t('headers.data') }}
      </div>

      <v-textarea
        :value="figure.data"
        :readonly="readonly"
        :autofocus="!readonly"
        outlined
        no-resize
        hide-details
        class="md-textarea"
        @input="updateMD($event)"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { debounce } from 'lodash';
import type { AnyCustomFigure } from '~/lib/templates/customTemplates';
import useTemplateStore from '~/stores/template';

export default defineComponent({
  props: {
    id: {
      type: String,
      required: true,
    },
    layoutId: {
      type: String,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const templateStore = useTemplateStore();

    return { templateStore };
  },
  data: () => ({
    renderedMD: '',
  }),
  mounted() {
    if (this.figure?.data && typeof this.figure.data === 'string') {
      this.MDtoHTML(this.figure.data);
    }
  },
  computed: {
    figure: {
      get(): AnyCustomFigure | undefined {
        const layout = this.templateStore.currentLayouts.find(
          ({ _: { id } }) => id === this.layoutId,
        );
        return layout?.figures.find(({ _: { id } }) => id === this.id);
      },
      set(val: AnyCustomFigure) {
        this.templateStore.UPDATE_FIGURE(this.layoutId, this.id, val);
      },
    },
  },
  methods: {
    MDtoHTML(data: string) {
      const html = DOMPurify.sanitize(
        marked(
          data,
          { mangle: false, headerIds: false },
        ),
      );
      this.renderedMD = html;
    },
    debouncedMDtoHTML: debounce(
      // eslint-disable-next-line func-names
      function (this: any, data: string) { this.MDtoHTML(data); },
      1000,
    ),
    updateMD(data: string) {
      if (!this.figure) {
        return;
      }

      this.figure = { ...this.figure, data };
      this.debouncedMDtoHTML(data);
    },
  },
});
</script>

<style lang="scss" scoped>
.md-container {
  height: 75vh;
}

.md-preview {
  height: 100%;
}

.md-content {
  height: 100%;
  overflow: auto;

  &::v-deep {
    h1, h2, h3, h4, h5, h6 {
      font-weight: normal;
    }

    h1 {
      line-height: 48pt;
      font-size: 48pt;
    }
    h2 {
      line-height: 24pt;
      font-size: 24pt;
    }
    h3 {
      line-height: 16pt;
      font-size: 16pt;
    }
    h4 {
      line-height: 12pt;
      font-size: 12pt;
    }
    h5 {
      line-height: 10pt;
      font-size: 10pt;
    }
    h6 {
      line-height: 6pt;
      font-size: 6pt;
    }
  }
}

.md-textarea,
.md-textarea::v-deep(.v-input__control),
.md-textarea::v-deep(.v-input__slot) {
  height: 100%;
}
</style>

<i18n lang="yaml">
en:
  headers:
    preview: 'Preview'
    data: 'Content'
fr:
  headers:
    preview: 'Prévisualisation'
    data: 'Contenu'
</i18n>
