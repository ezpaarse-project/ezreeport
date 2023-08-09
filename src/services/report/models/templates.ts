import Joi from 'joi';

import { appLogger } from '~/lib/logger';
import config from '~/lib/config';

import prisma from '~/lib/prisma';
import { Prisma, type Template as PrismaTemplate, type Task } from '~/lib/prisma';

import type { Fetchers } from '~/generators/fetchers';
import renderers, { type Renderers } from '~/generators/renderers';

import { ArgumentError } from '~/types/errors';

import { layoutSchema, type Layout } from './layouts';
import type { TaskList } from './tasks';

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
  inserts: (Layout<F> & { at: number })[]
}

export type AnyTaskTemplate = TaskTemplate<keyof Fetchers>;

export const taskTemplateSchema = Joi.object<AnyTaskTemplate>({
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
  tasks: Omit<TaskList[number], 'tags'>[]
}

const fullTemplateSchema = Joi.object<Pick<FullTemplate, 'body' | 'tags' | 'name'>>({
  name: Joi.string().trim().required(),
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
export const isFullTemplate = (data: unknown): data is Pick<FullTemplate, 'body' | 'name' | 'tags'> => {
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
export const getAllTemplates = async (): Promise<Omit<FullTemplate, 'body' | 'tasks'>[]> => {
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

const tasksInclude = {
  select: {
    id: true,
    name: true,
    namespaceId: true,
    recurrence: true,
    nextRun: true,
    lastRun: true,
    enabled: true,
    createdAt: true,
    updatedAt: true,
  },
  where: {
    lastExtended: {
      equals: Prisma.DbNull,
    },
  },
} satisfies Prisma.Template$tasksArgs;

/**
 * Get specific template
 *
 * @param id The id of the template
 *
 * @returns Full info of template
 */
export const getTemplateById = async (id: string): Promise<FullTemplate | null> => {
  const template = await prisma.template.findUnique({
    where: {
      id,
    },
    include: {
      tasks: tasksInclude,
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

/**
 * Get specific template
 *
 * @param name The name of the template
 *
 * @returns Full info of template
 */
export const getTemplateByName = async (name: string): Promise<FullTemplate | null> => {
  const template = await prisma.template.findUnique({
    where: {
      name,
    },
    include: {
      tasks: tasksInclude,
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

/**
 * Create a new template
 *
 * @param data The content of the template
 * @param id Wanted id
 *
 * @returns The created template
 */
export const createTemplate = async (
  data: Pick<FullTemplate, 'body' | 'name' | 'tags'>,
  id?: string,
): Promise<FullTemplate> => {
  const template = await prisma.template.create({
    data: {
      id,
      ...data,
      tags: data.tags as Prisma.InputJsonValue[],
      body: data.body as object,
    },
    include: {
      tasks: tasksInclude,
    },
  });
  appLogger.verbose(`[models] Template "${template.id}" created`);

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

// Thanks Prisma for begin so friendly with types...
type Transaction = Parameters<Parameters<(typeof prisma)['$transaction']>[0]>[0];

export const linkTaskToTemplate = async (id: Task['id'], templateId: FullTemplate['id'], origin: string, tx: Transaction = prisma) => {
  const template = await tx.template.findUniqueOrThrow({
    where: { id: templateId },
  });

  const res = await tx.task.update({
    data: {
      extendedId: templateId,
      lastExtended: Prisma.DbNull,
      activity: {
        create: { type: 'edition', message: `Tâche liée à "${template.name}" par ${origin}` },
      },
    },
    where: {
      id,
    },
  });
  appLogger.verbose(`[models] Task "${id}" linked to Template "${template.id}"`);

  return res;
};

export const unlinkTaskFromTemplate = async (id: Task['id'], origin: string, tx: Transaction = prisma) => {
  const task = await tx.task.findUniqueOrThrow({
    where: { id },
    include: { extends: true },
  });
  const template = task.extends.body;

  if (!isTaskTemplate(task.template)) {
    // As validation throws an error, this line shouldn't be called
    return {} as Task;
  }

  if (!isTemplate(template)) {
    // As validation throws an error, this line shouldn't be called
    return {} as Task;
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const { at, ...layout } of (task.template.inserts ?? [])) {
    template.layouts.splice(at, 0, layout);
  }

  task.template.inserts = template.layouts.map((l, i) => ({ ...l, at: i }));

  const res = await tx.task.update({
    data: {
      template: task.template,
      extendedId: config.defaultTemplate.id,
      lastExtended: {
        id: task.extends.id,
        name: task.extends.name,
        tags: task.extends.tags,
      },
      activity: {
        create: { type: 'edition', message: `Tâche déliée de "${task.extends.name}" par ${origin}` },
      },
    },
    where: {
      id,
    },
  });
  appLogger.verbose(`[models] Task "${id}" unlinked from Template "${task.extends.id}" (now linked to "${config.defaultTemplate.id}")`);

  return res;
};

/**
 * Delete specific template
 *
 * @param id The id of the template
 *
 * @returns The deleted template
 */
export const deleteTemplateById = async (id: string): Promise<FullTemplate | null> => {
  const res = await getTemplateById(id);
  if (!res) {
    return null;
  }

  // Wrapping in a transaction to assure rollback on fail
  const template = await prisma.$transaction(async (tx) => {
    // Unlink tasks first
    await Promise.all(
      res.tasks.map((task) => unlinkTaskFromTemplate(task.id, 'template-deletion', tx)),
    );

    // Delete template
    return tx.template.delete({
      where: {
        id,
      },
      include: {
        tasks: tasksInclude,
      },
    });
  });

  appLogger.verbose(`[models] Template "${id}" deleted`);

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

export const editTemplateById = async (
  id: string,
  data: Pick<FullTemplate, 'body' | 'name' | 'tags'>,
): Promise<FullTemplate | null> => {
  const res = await getTemplateById(id);
  if (!res) {
    return null;
  }

  const template = await prisma.template.update({
    where: {
      id,
    },
    data: {
      ...data,
      tags: data.tags as Prisma.InputJsonValue[],
      body: data.body as object,
    },
    include: {
      tasks: tasksInclude,
    },
  });
  appLogger.verbose(`[models] Template "${id}" updated`);

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
