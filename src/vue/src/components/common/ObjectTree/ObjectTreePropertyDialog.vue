<template>
  <v-dialog
    :value="shown"
    @input="close"
    max-width="600"
  >
    <v-card v-if="item.ref">
      <v-card-title>
        <v-text-field
          v-model="item.property"
          :label="$t('headers.property')"
          :rules="rules.property"
        />

        <v-spacer />

        <v-btn icon text @click="close()">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-form v-model="valid" class="mt-2">
          <v-row>
            <v-col>
              <v-select
                :value="item.type"
                :items="availableTypes"
                :label="$t('headers.type')"
                :rules="rules.type"
                value-field="Constructor"
                return-object
                @change="onTypeChange"
              />
            </v-col>
            <v-col>
              <v-text-field
                v-if="typeof item.value === 'string' || typeof item.value === 'number'"
                :value="item.value"
                :label="$t('headers.value')"
                :type="typeof item.value === 'number' ? 'number' : 'text'"
                :rules="rules.value"
                @input="typeof item.value === 'number' ? item.value = +$event : item.value = $event"
              />
              <v-switch
                v-if="typeof item.value === 'boolean'"
                v-model="item.value"
                :label="$t('headers.value')"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn color="error" @click="del">
          {{ $t('actions.delete') }}
        </v-btn>

        <v-spacer />

        <v-btn @click="close">
          {{ $t('actions.cancel') }}
        </v-btn>

        <v-btn :disabled="!valid || !isPropertyValid" color="success" @click="save">
          {{ $t('actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type ObjectTreeItem from './ObjectTreeItem.vue';

type Constructor =
  | NumberConstructor
  | StringConstructor
  | ObjectConstructor
  | ArrayConstructor
  | BooleanConstructor;
type ItemType = { text: string, Constructor: Constructor };

export default defineComponent({
  expose: ['open', 'close'],
  data: () => ({
    shown: false,

    item: {
      ref: undefined as InstanceType<typeof ObjectTreeItem> | undefined,
      property: '' as string | number,
      type: { } as ItemType,
      value: '' as any,
    },
    valid: false,

    availableTypes: [String, Number, Object, Array, Boolean].map((Constructor) => ({
      text: Constructor.name,
      Constructor,
    })),
  }),
  computed: {
    rules() {
      return {
        property: [
          (v: string | number) => v.toString().length > 0 || this.$t('errors.empty'),
        ],
        type: [
          (v: ItemType) => !!v || this.$t('errors.empty'),
        ],
        value: [
          (v: any) => this.item.type.Constructor.name === v.constructor.name || this.$t('errors.number'),
        ],
      };
    },
    isPropertyValid() {
      return this.rules.property.every((fnc) => fnc(this.item.property) === true);
    },
  },
  methods: {
    /**
     * Open the dialog
     *
     * @param item The current item
     */
    open(item: InstanceType<typeof ObjectTreeItem>) {
      this.item = {
        ref: item as any,
        property: item.property,
        type: this.availableTypes.find(
          ({ Constructor }) => Constructor.name === item.value.constructor.name,
        ) ?? this.availableTypes[0],
        value: item.value,
      };
      this.shown = true;
    },
    /**
     * Close the dialog
     */
    close() {
      this.item.ref = undefined;
      this.shown = false;
    },
    /**
     * Save data and close the dialog
     */
    save() {
      if (!this.valid || !this.isPropertyValid) {
        return;
      }
      this.item.ref?.$emit('input', this.item.property, this.item.value);
      this.close();
    },
    /**
     * Delete data and close the dialog
     */
    del() {
      this.item.ref?.$emit('delete');
      this.close();
    },
    /**
     * Called when type have changed
     */
    onTypeChange(newType: ItemType) {
      this.item.value = (new newType.Constructor()).valueOf();
      this.item.type = newType;
    },
  },
});
</script>

<style scoped>

</style>

<i18n lang="yaml">
en:
  headers:
    property: 'Property name'
    type: 'Property type'
    value: 'Property value'
  actions:
    cancel: 'Cancel'
    save: 'Save'
    delete: 'Delete'
  errors:
    empty: 'This field is required'
    number: 'The value must be the same type as the property'
fr:
  headers:
    property: 'Nom de la propriétée'
    type: 'Type de la propriétée'
    value: 'Valeur de la propriétée'
  actions:
    cancel: 'Annuler'
    save: 'Sauvegarder'
    delete: 'Supprimer'
  errors:
    empty: 'Ce champ est requis'
    number: 'La valeur doit être du même type que la propriétée'
</i18n>
