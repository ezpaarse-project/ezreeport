<template>
  <v-card
    :title="$t('$ezreeport.editor.title', modelValue.layouts.length)"
    prepend-icon="mdi-grid"
  >
    <template v-if="$slots.append" #append>
      <slot name="append" />
    </template>

    <v-divider />

    <v-toolbar color="transparent" density="compact">
      <v-col cols="2" class="d-flex align-center ml-2">
        {{ $t('$ezreeport.editor.title:layouts') }}
      </v-col>

      <v-divider vertical />

      <v-col v-if="currentLayout" class="d-flex align-center">
        {{ $t('$ezreeport.editor.title:figures') }}
      </v-col>
    </v-toolbar>

    <v-divider />

    <v-card-text class="py-0">
      <v-row class="pt-2" style="height: 100%">
        <v-col cols="2" class="pb-0 px-0" style="height: 100%">
          <EditorDrawer
            ref="drawerRef"
            v-model="innerIndex"
            v-model:items="innerLayouts"
            :readonly="readonly"
            @click:create="createNewLayout()"
            @click:duplicate="(layout, index) => cloneLayout(layout, index)"
            @click:delete="(layout) => deleteLayout(layout)"
          />
        </v-col>

        <v-divider vertical />

        <v-col class="pb-0">
          <v-empty-state
            v-if="innerLayouts.length === 0"
            :title="$t('$ezreeport.editor.noLayouts')"
            icon="mdi-format-page-break"
          >
            <template #actions>
              <v-btn
                :text="$t('$ezreeport.editor.createLayout')"
                color="green"
                append-icon="mdi-plus"
                @click="createNewLayout()"
              />
            </template>
          </v-empty-state>

          <EditorLayout
            v-else-if="currentLayout"
            v-model="currentLayout"
            :readonly="readonly"
          />

          <v-empty-state
            v-else
            :title="$t('$ezreeport.editor.noSelected')"
            :text="$t('$ezreeport.editor.noSelected:desc')"
            icon="mdi-selection"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-actions v-if="$slots.actions">
      <slot name="actions" />
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import {
  createLayoutHelper,
  createLayoutHelperFrom,
  layoutHelperToJSON,
  type LayoutHelper,
} from '~sdk/helpers/layouts';
import {
  addLayoutOfHelper,
  updateLayoutOfHelper,
  removeLayoutOfHelper,
  type TemplateBodyHelper,
} from '~sdk/helpers/templates';

// Components props
const props = defineProps<{
  /** The body to edit */
  modelValue: TemplateBodyHelper;
  /** Should be readonly */
  readonly?: boolean;
  /** Current layout index */
  index?: number;
}>();

// Components events
const emit = defineEmits<{
  /** Updated body */
  (event: 'update:modelValue', value: TemplateBodyHelper): void;
  /** Updated index */
  (event: 'update:index', value: number): void;
}>();

// Utils composables
// oxlint-disable-next-line id-length
const { t } = useI18n();

/** Current layout index, a computed around props if provided */
let innerIndex: Ref<number> | WritableComputedRef<number> = ref(0);
if (props.index != null) {
  innerIndex = computed({
    get: () => props.index ?? 0,
    set: (value) => {
      emit('update:index', value);
    },
  });
}

/** Drawer of layout list */
const drawerRef = useTemplateRef('drawerRef');
/** Layouts */
const innerLayouts = computed({
  get: () => props.modelValue.layouts,
  set: (value) => {
    const params = props.modelValue;
    params.layouts = value;
    emit('update:modelValue', params);
  },
});
/** Current layout selected */
const currentLayout = computed({
  get: () => props.modelValue.layouts.at(innerIndex.value),
  set: (value) => {
    if (!currentLayout.value || !value) {
      return;
    }

    try {
      updateLayoutOfHelper(props.modelValue, currentLayout.value, value);
    } catch (err) {
      handleEzrError(t('$ezreeport.editor.layouts.errors.edit'), err);
    }
  },
});

async function createNewLayout() {
  try {
    const layout = createLayoutHelper([]);
    addLayoutOfHelper(props.modelValue, layout);

    innerIndex.value = props.modelValue.layouts.length - 1;
    await nextTick();
    drawerRef.value?.scrollDown();
  } catch (err) {
    handleEzrError(t('$ezreeport.editor.layouts.errors.create'), err);
  }
}

async function cloneLayout(layout: LayoutHelper, index: number) {
  try {
    const clone = createLayoutHelperFrom(layoutHelperToJSON(layout));
    const newIndex = index + 1;

    addLayoutOfHelper(props.modelValue, clone, newIndex);
    innerIndex.value = newIndex;

    await nextTick();
    drawerRef.value?.scrollTo(newIndex);
  } catch (err) {
    handleEzrError(t('$ezreeport.editor.layouts.errors.clone'), err);
  }
}

function deleteLayout(layout: LayoutHelper) {
  try {
    removeLayoutOfHelper(props.modelValue, layout);
  } catch (err) {
    handleEzrError(t('$ezreeport.editor.layouts.errors.delete'), err);
  }
}

onMounted(() => {
  if (props.index != null) {
    drawerRef.value?.scrollTo(props.index);
  }
});
</script>
