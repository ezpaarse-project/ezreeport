import { appLogger } from '~/lib/logger';
import config from '~/lib/config';
import { type Static, Type, Value } from '~/lib/typebox';

import prisma from '~/lib/prisma';
import {
  Prisma,
  type TaskPreset,
  type Template as PrismaTemplate,
  type Task,
} from '~/lib/prisma';

import { Layout } from './layouts';

const logger = appLogger.child({ scope: 'models', model: 'templates' });

export const Template = Type.Object({
  layouts: Type.Array(
    Layout,
  ),

  fetchOptions: Type.Optional(
    Type.Object({
      filters: Type.Optional(
        Type.Record(Type.String(), Type.Any()),
      ),

      dateField: Type.String({ minLength: 1 }),

      index: Type.Optional(
        Type.String({ minLength: 1 }),
      ),
    }),
  ),

  renderer: Type.Optional(
    Type.Literal('vega-pdf'),
  ),

  renderOptions: Type.Optional(
    Type.Object({
      grid: Type.Optional(
        Type.Object({
          cols: Type.Integer({ minimum: 1 }),
          rows: Type.Integer({ minimum: 1 }),
        }),
      ),
    }),
  ),
});

export type TemplateType = Static<typeof Template>;

export const TaskTemplate = Type.Object({
  fetchOptions: Type.Object({
    filters: Type.Optional(
      Type.Record(Type.String(), Type.Any()),
    ),

    dateField: Type.Optional(
      Type.String({ minLength: 1 }),
    ),

    index: Type.String({ minLength: 1 }),
  }),

  inserts: Type.Optional(
    Type.Array(
      Type.Intersect([
        Layout,
        Type.Object({
          at: Type.Integer({ minimum: 0 }),
        }),
      ]),
    ),
  ),
});

export type TaskTemplateType = Static<typeof TaskTemplate>;

export const TagTemplate = Type.Object({
  name: Type.String({ minLength: 1 }),

  color: Type.Optional(
    Type.String(),
  ),
});

export type TagTemplateType = Static<typeof TagTemplate>;

export const FullTemplateBody = Type.Object({
  name: Type.String({ minLength: 1 }),

  body: Template,

  tags: Type.Optional(
    Type.Array(
      TagTemplate,
    ),
  ),
});

export type FullTemplateBodyType = Static<typeof FullTemplateBody>;

export interface FullTemplate extends Omit<PrismaTemplate, 'body' | 'tags'> {
  body: TemplateType,
  tags: TagTemplateType[],
  pageCount: number,
  tasks: Pick<Task, 'id' | 'name' | 'namespaceId' | 'recurrence' | 'nextRun' | 'lastRun' | 'enabled' | 'createdAt' | 'updatedAt'>[],
  presets: TaskPreset[],
}

type TemplateList = Omit<FullTemplate, 'body' | 'tasks' | 'presets'>[];

/**
 * Cast Prisma's template into a standard Template
 *
 * @param data The data from Prisma
 *
 * @re
 * const { tasks, presets, ...t } = template;turns A standard Template
 */
const castFullTemplate = <T extends PrismaTemplate>(data: T): T & Omit<FullTemplate, 'tasks' | 'presets'> => {
  const body = Value.Cast(Template, data.body);
  return {
    ...data,
    body,
    tags: Value.Cast(Type.Array(TagTemplate), data.tags),
    pageCount: body.layouts.length,
  };
};

/**
* Get all template
*
* @returns General info of all templates
*/
export const getAllTemplates = async (): Promise<TemplateList> => {
  const res = await prisma.template.findMany();

  return res
    .filter((template) => Value.Check(Template, template.body))
    .map(({ body, ...template }) => {
      // We did the type check in .filter
      const { layouts } = body as Static<typeof Template>;
      return {
        ...template,
        tags: Value.Cast(Type.Array(TagTemplate), template.tags),
        pageCount: layouts.length,
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
      presets: true,
    },
  });

  if (!template) {
    return null;
  }

  const { tasks, presets, ...t } = template;
  return {
    ...castFullTemplate(t),
    tasks,
    presets,
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
      presets: true,
    },
  });

  if (!template) {
    return null;
  }

  const { tasks, presets, ...t } = template;
  return {
    ...castFullTemplate(t),
    tasks,
    presets,
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
  data: FullTemplateBodyType,
  id?: string,
): Promise<FullTemplate> => {
  const template = await prisma.template.create({
    data: {
      id,
      ...data,
    },
    include: {
      tasks: tasksInclude,
      presets: true,
    },
  });

  logger.debug({
    id: template.id,
    msg: 'Template created',
  });

  const { tasks, presets, ...t } = template;
  return {
    ...castFullTemplate(t),
    tasks,
    presets,
  };
};

// Thanks Prisma for begin so friendly with types...
type Transaction = Parameters<Parameters<(typeof prisma)['$transaction']>[0]>[0];

/**
 * Links a task to a template.
 *
 * @param id The ID of the task.
 * @param templateId The ID of the template to link to.
 * @param origin The origin of the link.
 * @param tx The transaction to use for the database operations.
 *
 * @return The updated task object.
 */
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

  logger.debug({
    id: template.id,
    taskId: id,
    msg: 'Task linked to template',
  });

  return res;
};

/**
 * Unlinks a task from a template.
 *
 * @param id The ID of the task to unlink.
 * @param origin The source of the unlinking action.
 * @param tx The transaction to use for database operations.
 *
 * @return A promise that resolves to the updated task.
 */
export const unlinkTaskFromTemplate = async (id: Task['id'], origin: string, tx: Transaction = prisma) => {
  const task = await tx.task.findUniqueOrThrow({
    where: { id },
    include: { extends: true },
  });

  const taskTemplate = Value.Cast(TaskTemplate, task.template);
  const template = Value.Cast(Template, task.extends.body);

  // eslint-disable-next-line no-restricted-syntax
  for (const { at, ...layout } of (taskTemplate.inserts ?? [])) {
    template.layouts.splice(at, 0, layout);
  }

  taskTemplate.inserts = template.layouts.map((l, i) => ({ ...l, at: i }));

  const res = await tx.task.update({
    data: {
      template: taskTemplate,
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

  logger.debug({
    id: task.extends.id,
    taskId: id,
    defaultTemplateId: config.defaultTemplate.id,
    msg: 'Task unlinked from template',
  });

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
        presets: true,
      },
    });
  });

  logger.debug({
    id: template.id,
    msg: 'Template deleted',
  });

  const { tasks, presets, ...t } = template;
  return {
    ...castFullTemplate(t),
    tasks,
    presets,
  };
};

/**
 * Edit specific template
 *
 * @param id The id of the template
 * @param data The new content of the template
 *
 * @returns The edited template
 */
export const editTemplateById = async (
  id: string,
  data: FullTemplateBodyType,
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
      presets: true,
    },
  });

  logger.debug({
    id: template.id,
    msg: 'Template updated',
  });

  const { tasks, presets, ...t } = template;
  return {
    ...castFullTemplate(t),
    tasks,
    presets,
  };
};
