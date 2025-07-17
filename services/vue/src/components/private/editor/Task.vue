<template>
  <v-card
    :title="$t('$ezreeport.editor.title', innerLayouts.length)"
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

        <template v-if="readonly || currentLayout.readonly">
          <v-spacer />

          <v-alert
            :title="$t('$ezreeport.readonly')"
            icon="mdi-lock"
            density="compact"
          />
        </template>
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
            :readonly="readonly || currentLayout.readonly"
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

    <template v-if="$slots.actions">
      <v-divider />

      <v-card-actions>
        <slot name="actions" />
      </v-card-actions>
    </template>
  </v-card>
</template>

<script setup lang="ts">
import type { TemplateBodyHelper } from '~sdk/helpers/templates';
import {
  createTaskLayoutHelper,
  createTaskLayoutHelperFrom,
  taskLayoutHelperToJSON,
  type TaskLayoutHelper,
  type AnyLayoutHelper,
} from '~sdk/helpers/layouts';
import {
  addLayoutOfHelper,
  updateLayoutOfHelper,
  removeLayoutOfHelper,
  type TaskBodyHelper,
  getLayoutsOfHelpers,
} from '~sdk/helpers/tasks';

// Components props
const props = defineProps<{
  /** The body to edit */
  modelValue: TaskBodyHelper;
  /** The template extended by current task */
  extends: TemplateBodyHelper;
  /** Should be readonly */
  readonly?: boolean;
  /** Current layout index */
  index?: number;
}>();

// Components events
const emit = defineEmits<{
  /** Updated body */
  (event: 'update:modelValue', value: TaskBodyHelper): void;
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
  get: () => getLayoutsOfHelpers(props.modelValue, props.extends),
  set: (value) => {
    const inserts: TaskLayoutHelper[] = value
      .map((lay, index) => ({ ...lay, at: index }))
      .filter((lay) => !lay.readonly);

    const params = props.modelValue;
    params.inserts = inserts;
    emit('update:modelValue', params);
  },
});
/** Current layout selected */
const currentLayout = computed({
  get: () => innerLayouts.value.at(innerIndex.value),
  set: (value) => {
    if (
      !currentLayout.value ||
      currentLayout.value.readonly ||
      !value ||
      value.readonly
    ) {
      return;
    }

    const at = innerIndex.value;
    try {
      updateLayoutOfHelper(
        props.modelValue,
        { ...currentLayout.value, at },
        { ...value, at }
      );
    } catch (err) {
      handleEzrError(t('$ezreeport.editor.inserts.errors.edit'), err);
    }
  },
});

async function createNewLayout() {
  try {
    const layout = createTaskLayoutHelper([], innerLayouts.value.length);
    addLayoutOfHelper(props.modelValue, layout);

    innerIndex.value = innerLayouts.value.length - 1;
    await nextTick();
    drawerRef.value?.scrollDown();
  } catch (err) {
    handleEzrError(t('$ezreeport.editor.inserts.errors.create'), err);
  }
}

async function cloneLayout(
  layout: AnyLayoutHelper & { readonly?: boolean },
  index: number
) {
  if (layout.readonly) {
    return;
  }

  try {
    const clone = createTaskLayoutHelperFrom(
      taskLayoutHelperToJSON({ ...layout, at: index })
    );
    const newIndex = index + 1;

    addLayoutOfHelper(props.modelValue, clone);
    innerIndex.value = newIndex;

    await nextTick();
    drawerRef.value?.scrollTo(newIndex);
  } catch (err) {
    handleEzrError(t('$ezreeport.editor.inserts.errors.clone'), err);
  }
}

function deleteLayout(layout: AnyLayoutHelper & { readonly?: boolean }) {
  if (layout.readonly) {
    return;
  }

  try {
    removeLayoutOfHelper(props.modelValue, { ...layout, at: 0 });
  } catch (err) {
    handleEzrError(t('$ezreeport.editor.inserts.errors.delete'), err);
  }
}

onMounted(() => {
  if (props.index != null) {
    drawerRef.value?.scrollTo(props.index);
  }
});
</script>
