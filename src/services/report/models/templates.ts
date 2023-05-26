import Joi from 'joi';
import prisma from '~/lib/prisma';
import type { Template as PrismaTemplate } from '~/lib/prisma';
import type { Fetchers } from '~/generators/fetchers';
import renderers, { type Renderers } from '~/generators/renderers';
import { ArgumentError } from '~/types/errors';
import { layoutSchema, type Layout } from './layouts';
import { appLogger } from '~/lib/logger';

/**
 * Template is the report
 *
 *  This interface describe a template in a template file (not in a task's `template` property)
 */
export interface Template<
 R extends keyof Renderers,
 F extends keyof Fetchers,
> {
  /**
  * Layouts that compose the template
  *
  * @see {Layout} for more info
  */
  layouts: Layout<F>[]
  /**
  * Options passed to the fetcher.
  *
  * Overrode by layouts `fetchOptions`.
  * Overrode by default `fetchOptions`.
  *
  * @see {fetchers} For more info
  */
  fetchOptions?: Layout<F>['fetchOptions'],
  /**
  * Name of the renderer
  *
  * @see {renderers} For more info
  */
  renderer?: R,
  /**
  * Options passed to the renderer.
  *
  * Overrode by default `rendererOptions`.
  *
  * @see {renderers} For more info
  */
  renderOptions?: |
  Omit<GeneratorParam<Renderers, R>, 'layouts' | 'doc'> &
  { doc: Omit<GeneratorParam<Renderers, R>['doc'], 'period'> },
}

export type AnyTemplate = Template<keyof Renderers, keyof Fetchers>;

const templateSchema = Joi.object<AnyTemplate>({
  layouts: Joi.array().items(layoutSchema).required(),
  fetchOptions: Joi.object(),
  renderer: Joi.string().valid(...Object.keys(renderers)),
  renderOptions: Joi.object(),
});

/**
 * Check if input data is a template file
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 */
export const isTemplate = (data: unknown): data is AnyTemplate => {
  const validation = templateSchema.validate(data, {});
  if (validation.error != null) {
    throw new ArgumentError(`Template is not valid: ${validation.error.message}`);
  }
  return true;
};

/**
* The interface describe options allowed in Task's
*/
export interface TaskTemplate<F extends keyof Fetchers> {
  /**
  * Base template file
  */
  extends: string
  /**
  * Options passed to the fetcher.
  *
  * Overrode by layouts `fetchOptions`.
  * Overrode by function `fetchOptions`.
  *
  * @see {fetchers} For more info
  */
  fetchOptions?: Layout<F>['fetchOptions'],
  /**
  * Additional layouts
  *
  * @see {Layout} for more info
  */
  inserts?: (Layout<F> & { at: number })[]
}

export type AnyTaskTemplate = TaskTemplate<keyof Fetchers>;

export const taskTemplateSchema = Joi.object<AnyTaskTemplate>({
  extends: Joi.string().required(),
  fetchOptions: Joi.object(),
  inserts: Joi.array().items(
    layoutSchema.append({
      at: Joi.number(),
    }),
  ),
});

/**
 * Check if input data is a task's template
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 */
export const isTaskTemplate = (data: unknown): data is AnyTaskTemplate => {
  const validation = taskTemplateSchema.validate(data, {});
  if (validation.error != null) {
    throw new ArgumentError(`Template is not valid: ${validation.error.message}`);
  }
  return true;
};

export interface FullTemplate extends Omit<PrismaTemplate, 'body'> {
  renderer: keyof Renderers,
  pageCount: number,
  body: AnyTemplate,
}

const fullTemplateSchema = Joi.object<Pick<FullTemplate, 'body' | 'tags'>>({
  body: templateSchema.required(),
  tags: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      color: Joi.string(),
    }),
  ),
});

/**
 * Check if input data is a showcased template
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 */
export const isFullTemplate = (data: unknown): data is Pick<FullTemplate, 'body'> => {
  const validation = fullTemplateSchema.validate(data, {});
  if (validation.error != null) {
    throw new ArgumentError(`Given data is not valid: ${validation.error.message}`);
  }
  return true;
};

/**
* Get all template
*
* @returns General info of all templates
*/
export const getAllTemplates = async (): Promise<Omit<FullTemplate, 'body'>[]> => {
  const res = await prisma.template.findMany();

  return res
    .filter((template) => {
      try {
        if (!isTemplate(template.body)) {
          // As validation throws an error, this line shouldn't be called
          return false;
        }
        return true;
      } catch (error) {
        return false;
      }
    })
    .map(({ body, ...template }) => {
      // We did the type check in .filter
      const b = body as unknown as AnyTemplate;
      return {
        ...template,
        renderer: b.renderer ?? 'vega-pdf',
        pageCount: b.layouts.length,
      };
    });
};

/**
 * Get specific template
 *
 * @returns Full info of template
 */
export const getTemplateByName = async (name: string): Promise<FullTemplate | null> => {
  const template = await prisma.template.findUnique({
    where: {
      name,
    },
  });

  if (!template) {
    return null;
  }

  if (!isTemplate(template.body)) {
    // As validation throws an error, this line shouldn't be called
    return {} as FullTemplate;
  }

  return {
    ...template,
    body: template.body,
    renderer: template.body.renderer ?? 'vega-pdf',
    pageCount: template.body.layouts.length,
  };
};

export const createTemplate = async (
  name: string,
  data: Pick<FullTemplate, 'body'>,
): Promise<FullTemplate> => {
  const template = await prisma.template.create({
    data: {
      ...data,
      name,
      body: data.body as object,
    },
  });
  appLogger.verbose(`[models] Template "${name}" created`);

  if (!isTemplate(template.body)) {
    // As validation throws an error, this line shouldn't be called
    return {} as FullTemplate;
  }

  return {
    ...template,
    body: template.body,
    renderer: template.body.renderer ?? 'vega-pdf',
    pageCount: template.body.layouts.length,
  };
};

export const deleteTemplateByName = async (name: string): Promise<FullTemplate | null> => {
  const res = await getTemplateByName(name);
  if (!res) {
    return null;
  }

  const template = await prisma.template.delete({
    where: {
      name,
    },
  });
  appLogger.verbose(`[models] Template "${name}" deleted`);

  // Here only for type completion (should always returns true)
  if (!isTemplate(template.body)) {
    // As validation throws an error, this line shouldn't be called
    return {} as FullTemplate;
  }

  return {
    ...template,
    body: template.body,
    renderer: template.body.renderer ?? 'vega-pdf',
    pageCount: template.body.layouts.length,
  };
};

export const editTemplateByName = async (
  name: string,
  data: Pick<FullTemplate, 'body'>,
): Promise<FullTemplate | null> => {
  const res = await getTemplateByName(name);
  if (!res) {
    return null;
  }

  const template = await prisma.template.update({
    where: {
      name,
    },
    data: {
      ...data,
      body: data.body as object,
    },
  });
  appLogger.verbose(`[models] Template "${name}" updated`);

  // Here only for type completion (should always returns true)
  if (!isTemplate(template.body)) {
    // As validation throws an error, this line shouldn't be called
    return {} as FullTemplate;
  }

  return {
    ...template,
    body: template.body,
    renderer: template.body.renderer ?? 'vega-pdf',
    pageCount: template.body.layouts.length,
  };
};
