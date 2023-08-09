import { defineStore } from 'pinia';
import { omit } from 'lodash';
import { type tasks, templates, auth } from '@ezpaarse-project/ezreeport-sdk-js';
import type VueI18n from 'vue-i18n';

import {
  type AnyCustomTemplate,
  type CustomTemplate,
  type AnyCustomLayout,
  type AnyCustomFigure,
  addAdditionalDataToLayouts,
  removeAdditionalDataToLayouts,
} from '~/lib/templates/customTemplates';

import { watch } from 'vue';
import pinia from '.';

// Utility types
export type AnyTemplate = templates.FullTemplate['body'] | tasks.FullTask['template'];
export type Grid = { cols: number, rows: number };
export type ValidationRule<T = any> = (v: T) => ValidationResult;
export type ValidationResult = true | {
  i18nKey: string,
  figure?: number,
  layout?: number,
  field?: string
};
export type FetchOptions = {
  index: string | undefined;
  dateField: string | undefined;
  isFetchCount: boolean;
  fetchCount: string | undefined;
  filters: Record<string, any>;
  filtersCount: number;
  others: Record<string, any>;
  othersCount: number;
  aggs: any[];
};

export const supportedFetchOptions = ['filters', 'fetchCount', 'aggs', 'aggregations', 'dateField', 'index'];

// Utility functions
export const isFullTemplate = (template?: AnyTemplate): template is templates.FullTemplate['body'] => !!template && 'layouts' in template;
export const isTaskTemplate = (template?: AnyTemplate): template is tasks.FullTask['template'] => !!template && !isFullTemplate(template);

/**
 * Transform raw `fetchOptions` into usable data
 *
 * @param fetchOptions raw data
 *
 * @returns usable data
 */
export const transformFetchOptions = (fetchOptions: any): FetchOptions => {
  const opts: FetchOptions = {
    index: undefined,
    dateField: undefined,
    isFetchCount: false,
    fetchCount: undefined,
    filters: {},
    filtersCount: 0,
    others: {},
    othersCount: 0,
    aggs: [],
  };

  if (!fetchOptions) {
    return opts;
  }

  // Extract filters with compatible type definition
  if (fetchOptions.filters && typeof fetchOptions.filters === 'object') {
    opts.filters = fetchOptions.filters;
    opts.filtersCount = Object.values(opts.filters).reduce(
      (prev, value) => {
        let count = 0;
        if (Array.isArray(value)) {
          count = value.length;
        }
        return prev + count;
      },
      0,
    );
  }

  // Extract fetch count with compatible type definition
  if (fetchOptions.fetchCount != null && typeof fetchOptions.fetchCount === 'string') {
    opts.fetchCount = fetchOptions.fetchCount;
    opts.isFetchCount = typeof opts.fetchCount === 'string';
  }

  // Extract aggs with compatible type definition
  if (fetchOptions.aggs && Array.isArray(fetchOptions.aggs)) {
    opts.aggs = fetchOptions.aggs;
  }
  if (fetchOptions.aggregations && Array.isArray(fetchOptions.aggregations)) {
    opts.aggs = fetchOptions.aggregations;
  }

  // Extract index with compatible type definition
  if (fetchOptions.index != null) {
    opts.index = fetchOptions.index.toString();
  }

  // Extract date with compatible type definition
  if (fetchOptions.dateField != null) {
    opts.dateField = fetchOptions.dateField.toString();
  }

  opts.others = omit(fetchOptions, supportedFetchOptions);
  opts.othersCount = Object.keys(opts.others).length;
  return opts;
};

/**
 * Run all given validation rules against given values
 *
 * @param toValidate rules to run and corresponding values
 *
 * @returns The first error encountered, or `true` if all rules pass
 */
const execAllRules = (toValidate: { rules: ValidationRule[], value: any }[]): ValidationResult => {
  // eslint-disable-next-line no-restricted-syntax
  for (const { rules, value } of toValidate) {
    // Test all given rules
    // eslint-disable-next-line no-restricted-syntax
    for (const rule of rules) {
      const result = rule(value);
      if (result !== true) {
        return result;
      }
    }
  }
  return true;
};

/**
 * Map given rules to to be compatible with vuetify.
 *
 * `templateStore` uses a custom validation result (cf. `ValidationResult`) instead of vuetify's
 * (`true | string`).
 *
 * @param ruleMap rules to map
 * @param $t The instance of i18n
 *
 * @returns The same structure with simplified type
 */
export const mapRulesToVuetify = (
  ruleMap: Record<string, ValidationRule[]>,
  $t: typeof VueI18n.prototype.t,
) => Object.fromEntries(
  Object.entries(ruleMap)
    .map(([key, rules]) => [
      key,
      rules.map((rule) => (
        (value: any) => {
          const res = rule(value);
          if (res === true) { return true; }
          return $t(res.i18nKey);
        }
      )),
    ]),
);

// Fetch functions
/**
 * Fetch given template
 *
 * @param id The template id
 */
const fetchTemplate = async (
  id: string,
): Promise<{ error?: { i18n?: string, message?: string }, value?: CustomTemplate }> => {
  try {
    const { content } = await templates.getTemplate(id);
    if (!content) {
      return { error: { i18n: '$ezreeport.errors.fetch' } };
    }

    content.body.layouts = addAdditionalDataToLayouts(content.body.layouts);
    return { value: content.body as CustomTemplate };
  } catch (error) {
    return { error: { message: (error as Error).message } };
  }
};

/**
 * Fetch all available templates
 */
const refreshAvailableTemplates = async (): Promise<{
  error?: { i18n?: string, message?: string }, value?: { content: templates.Template[], meta: any }
}> => {
  try {
    const { content, meta } = await templates.getAllTemplates();

    if (!content) {
      return { error: { i18n: '$ezreeport.errors.fetch' } };
    }

    return { value: { content, meta } };
  } catch (error) {
    return { error: { message: (error as Error).message } };
  }
};

// Pinia store
const useTemplatePinia = defineStore('ezr_template', {
  state: () => ({
    /**
     * Current template created/edited/reviewed
     *
     * Remember to run validation (`store.validateCurrent()`) after editing it
     */
    current: undefined as AnyCustomTemplate | undefined,
    /**
     * Validation state. Avoid editing it directly
     */
    isCurrentValid: true as ValidationResult,
    /**
     * Extended template. Avoid editing it
     */
    extended: undefined as CustomTemplate | undefined,
    extendedId: undefined as string | undefined,
    /**
     * Available templates to extend. Avoid editing it directly
     */
    available: [] as templates.Template[],
    /**
     * Id of the default template
     */
    defaultTemplateId: '',
    /**
     * Current internal error
     */
    error: {} as { i18n?: string, message?: string },
  }),
  getters: {
    /**
     * Layouts of current template, merged with layouts from extended template
     *
     * @returns Layouts
     */
    currentLayouts(): AnyCustomLayout[] {
      if (!this.current) {
        return [];
      }

      if (isFullTemplate(this.current)) {
        return this.current.layouts;
      }

      // Base layouts
      const layouts = [...(this.extended?.layouts ?? [])];
      // Layouts to insert
      const inserts = [...(this.current.inserts ?? [])];
      // eslint-disable-next-line no-restricted-syntax
      for (const layout of inserts) {
        layouts.splice(layout.at, 0, layout);
      }

      return layouts;
    },

    /**
     * Current grid of template
     *
     * @returns Grid
     */
    currentGrid(): Grid {
      let grid;
      // If grid is defined in extended template
      if (this.extended?.renderOptions?.grid) {
        grid = this.extended.renderOptions.grid as Grid;
      }

      // If grid is defined in current template
      if (isFullTemplate(this.current) && this.current.renderOptions?.grid) {
        grid = this.current.renderOptions.grid as Grid;
      }

      return grid ?? { cols: 2, rows: 2 };
    },

    /**
     * `fetchOptions` of template, but usable
     *
     * @returns Usable `fetchOptions` with correct typing definition
     */
    currentFetchOptions(): FetchOptions | undefined {
      if (!this.current) { return undefined; }
      return transformFetchOptions(this.current.fetchOptions);
    },

    /**
     * Validation rules
     */
    rules(): Record<string, Record<string, ValidationRule[]>> {
      return {
        template: {
          index: [
            (v: string) => {
              if (isFullTemplate(this.current)) {
                return true;
              }

              return v?.length > 0 || { i18nKey: '$ezreeport.errors.empty' };
            },
          ],
          dateField: [
            (v: string) => {
              if (isFullTemplate(this.current)) {
                return v?.length > 0 || { i18nKey: '$ezreeport.errors.empty' };
              }
              return !v || v.length > 0 || { i18nKey: '$ezreeport.errors.empty' };
            },
          ],
        },

        layouts: {
          figures: [
            (v: AnyCustomFigure[]) => v.length > 0 || { i18nKey: '$ezreeport.layouts.errors.length' },
          ],
        },

        figures: {
          slots: [
            (v: AnyCustomFigure['slots']) => (v && v.length > 0) || { i18nKey: '$ezreeport.figures.errors.no_slots' },
            (v: AnyCustomFigure['slots']) => {
              if (!v) {
                return true;
              }

              const grid = this.currentGrid;
              const slots = [...v].sort();
              if (slots.length === grid.cols * grid.rows) {
                return true;
              }

              // Check if slot combinaison is possible, extracted from vega-pdf
              // TODO[feat]: support complex squares
              const isSameRow = slots.every(
                // Every slot on same row
                (s, row) => Math.floor(s / grid.cols) === Math.floor(slots[0] / grid.cols)
                  // Possible (ex: we have 3 cols, and we're asking for col 1 & 3 but not 2)
                  && (row === 0 || s - slots[row - 1] === 1),
              );
              const isSameCol = slots.every(
                // Every slot on same colon
                (s, col) => s % grid.cols === slots[0] % grid.cols
                  // Possible (ex: we have 3 rows, and we're asking for row 1 & 3 but not 2)
                  && (col === 0 || s - slots[col - 1] === grid.cols),
              );

              return isSameRow || isSameCol || { i18nKey: '$ezreeport.figures.errors.slot_incompatibility' };
            },
          ],
        },
      };
    },

    /**
     * Default template to extend when creating a task
     */
    defaultTemplate(): templates.Template | undefined {
      return this.available.find(({ id }) => this.defaultTemplateId === id);
    },
  },
  actions: {
    /**
     * Transform given template into a custom one and set it as current of the store
     *
     * @param template The template you want to create/edit/review
     */
    SET_CURRENT(template: AnyTemplate | undefined, extended?: string) {
      if (!template) {
        this.current = undefined;
        this.extended = undefined;
        return;
      }

      if (extended) {
        this.SET_EXTENDED(extended);
      }

      if (isTaskTemplate(template)) {
        const inserts = addAdditionalDataToLayouts(template.inserts ?? []);

        this.current = {
          ...template,
          inserts,
        };
        return;
      }

      const layouts = addAdditionalDataToLayouts(template.layouts);
      this.current = {
        ...template,
        layouts,
      };
    },

    async SET_EXTENDED(id: string) {
      const { error, value } = await fetchTemplate(id);
      if (error) {
        this.error = error;
      }

      if (value) {
        this.extendedId = id;
        this.extended = value;
      }
    },

    /**
     * Transform current template into it's original type
     *
     * @returns The template you created/edited/reviewed
     */
    GET_CURRENT(): AnyTemplate | undefined {
      if (!this.current) {
        return undefined;
      }

      if (isTaskTemplate(this.current)) {
        return {
          ...this.current,
          // Remove frontend data from payload
          inserts: removeAdditionalDataToLayouts(this.current.inserts ?? []),
        };
      }

      return {
        ...this.current,
        layouts: removeAdditionalDataToLayouts(this.current.layouts),
      };
    },

    ADD_LAYOUT(layout: AnyCustomLayout, index?: number) {
      if (!this.current) {
        return;
      }

      // Getting actual layouts
      let layouts = [];
      if (isTaskTemplate(this.current)) {
        if (!this.current.inserts) {
          this.current.inserts = [];
        }

        layouts = this.current.inserts;
      } else {
        layouts = this.current.layouts;
      }

      layouts.splice(index ?? layouts.length, 0, layout);
      this.validateCurrent();
    },

    /**
     * Update layout at given index
     *
     * @param layoutId The id of the layout
     * @param layout The layout data. If `undefined` the layout will be deleted
     */
    UPDATE_LAYOUT(layoutId: string, layout: AnyCustomLayout | undefined) {
      if (!this.current) {
        return;
      }

      // Getting actual layouts
      let layouts = [];
      if (isTaskTemplate(this.current)) {
        if (!this.current.inserts) {
          this.current.inserts = [];
        }

        layouts = this.current.inserts;
      } else {
        layouts = this.current.layouts;
      }

      const layoutIndex = layouts.findIndex(({ _: { id } }) => id === layoutId);
      if (layoutIndex < 0) {
        return;
      }

      if (layout) {
        layouts.splice(layoutIndex, 1, layout);
      } else {
        layouts.splice(layoutIndex, 1);
      }
      this.validateCurrent();
    },

    /**
     * Update layout's figure
     *
     * @param layoutId The id of the layout.
     * @param figureId The id of the figure
     * @param figure The figure data. If `undefined` the layout will be deleted
     */
    UPDATE_FIGURE(layoutId: string, figureId: string, figure: AnyCustomFigure | undefined) {
      const layout = this.currentLayouts.find(({ _: { id } }) => id === layoutId);
      if (!layout) {
        return;
      }

      const figureIndex = layout.figures.findIndex(({ _: { id } }) => id === figureId);
      if (figureIndex < 0) {
        return;
      }

      const figures = [...layout.figures];
      if (figure) {
        figures.splice(figureIndex, 1, figure);
      } else {
        figures.splice(figureIndex, 1);
      }

      this.UPDATE_LAYOUT(
        layout._.id,
        { ...layout, figures },
      );
    },

    /**
     * Run validation rules against current template
     */
    validateCurrent() {
      if (!this.current) {
        return;
      }

      let isTemplateValid: ValidationResult = true;
      const layouts = isTaskTemplate(this.current)
        ? this.current.inserts
        : this.current.layouts;
      // eslint-disable-next-line no-restricted-syntax
      for (let layoutIndex = 0; layoutIndex < (layouts ?? []).length; layoutIndex += 1) {
        const layout = (layouts ?? [])[layoutIndex];
        let isLayoutValid: ValidationResult = true;

        // eslint-disable-next-line no-restricted-syntax
        for (let figureIndex = 0; figureIndex < layout.figures.length; figureIndex += 1) {
          const figure = layout.figures[figureIndex];
          // Figures validation
          const isFigureValid = execAllRules([
            { rules: this.rules.figures.slots, value: figure.slots },
          ]);

          // Update figure & parent layout
          figure._.valid = isFigureValid;
          if (figure._.valid !== true) {
            figure._.valid.figure = figureIndex;
            isLayoutValid = isFigureValid;
          }
        }

        // Layouts validation
        if (isLayoutValid === true) {
          isLayoutValid = execAllRules([
            { rules: this.rules.layouts.figures, value: layout.figures },
          ]);
        }

        // Update layout & parent template
        layout._.valid = isLayoutValid;
        if (layout._.valid !== true) {
          layout._.valid.layout = layoutIndex;
          isTemplateValid = isLayoutValid;
        }
      }

      // Template validation
      if (isTemplateValid === true) {
        isTemplateValid = execAllRules([
          { rules: this.rules.template.index, value: this.current.fetchOptions?.index },
        ]);
      }

      this.isCurrentValid = isTemplateValid;
    },

    async refreshAvailableTemplates() {
      const { error, value } = await refreshAvailableTemplates();
      if (error) {
        this.error = error;
      }

      if (value) {
        this.available = value.content;
        this.defaultTemplateId = value.meta.default;
      }
    },
  },
});

const useTemplateStore = () => useTemplatePinia(pinia);

const init = async () => {
  const store = useTemplateStore();
  store.refreshAvailableTemplates();
  // Validate current on change
  watch(
    () => store.current,
    () => store.validateCurrent(),
  );
};

watch(
  () => auth.isLogged(),
  () => init(),
);

export default useTemplateStore;
