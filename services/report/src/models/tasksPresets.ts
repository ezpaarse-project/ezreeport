import { appLogger } from '~/lib/logger';
import { type Static, Type, Value } from '~/lib/typebox';

import prisma, {
  Recurrence,
  Template as PrismaTemplate,
  TaskPreset as PrismaTaskPreset,
  Prisma,
} from '~/lib/prisma';
import { TagTemplate, type FullTemplate } from '~/models/templates';

const logger = appLogger.child({ scope: 'models', model: 'tasks-presets' });

export const TasksPreset = Type.Object({
  name: Type.String({ minLength: 1 }),

  template: Type.String({ minLength: 1 }),

  fetchOptions: Type.Optional(
    Type.Object({
      dateField: Type.Optional(
        Type.String({ minLength: 1 }),
      ),
    }),
  ),

  recurrence: Type.Enum(Recurrence),
});

export type TasksPresetType = Static<typeof TasksPreset>;

type TasksPresetList = (Pick<PrismaTaskPreset, 'id' | 'name' | 'recurrence'> & {
  tags: FullTemplate['tags'];
})[];

type TemplateFieldsInFull = 'id' | 'name' | 'tags' | 'createdAt' | 'updatedAt';
export type FullTasksPreset = Omit<PrismaTaskPreset, 'templateId'> & {
  template: Pick<FullTemplate, TemplateFieldsInFull>;
};

const templateInclude = {
  select: {
    id: true,
    name: true,
    tags: true,
    createdAt: true,
    updatedAt: true,
  },
} satisfies Prisma.TemplateDefaultArgs;

/**
 * Cast Prisma's tasks' preset into a standard tasks' preset
 *
 * @param data The data from Prisma
 *
 * @returns A standard tasks' preset
 */
const castTasksPreset = (
  data: PrismaTaskPreset & { template: Pick<PrismaTemplate, TemplateFieldsInFull> },
): FullTasksPreset => {
  const { template, ...preset } = data;
  return {
    ...preset,
    template: {
      ...template,
      tags: Value.Cast(Type.Array(TagTemplate), template.tags),
    },
  };
};

/**
 * Get all tasks' presets in DB
 *
 * @param opts Requests options
 *
 * @returns Tasks' presets list
 */
export const getAllTasksPresets = async (): Promise<TasksPresetList> => {
  const presets = await prisma.taskPreset.findMany({
    select: {
      id: true,
      name: true,
      recurrence: true,
      createdAt: true,
      updatedAt: true,

      template: {
        select: {
          tags: true,
        },
      },
    },
  });

  return presets.map(({ template, ...preset }) => ({
    ...preset,
    tags: Value.Cast(Type.Array(TagTemplate), template.tags),
  }));
};

/**
 * Get specific tasks' preset
 *
 * @param id The id of the template
 *
 * @returns Full info of tasks' preset
 */
export const getTasksPresetById = async (id: string): Promise<FullTasksPreset | null> => {
  const preset = await prisma.taskPreset.findUnique({
    where: {
      id,
    },
    include: {
      template: templateInclude,
    },
  });

  if (!preset) {
    return null;
  }

  return castTasksPreset(preset);
};

/**
 * Create a new tasks' preset
 *
 * @param data The content of the tasks' preset
 * @param id Wanted id
 *
 * @returns The created tasks' preset
 */
export const createTasksPreset = async (
  { template, ...data }: TasksPresetType,
  id?: string,
): Promise<FullTasksPreset> => {
  const preset = await prisma.taskPreset.create({
    data: {
      id,
      ...data,
      templateId: template,
    },
    include: {
      template: templateInclude,
    },
  });

  logger.debug({
    id: preset.id,
    msg: 'Tasks\' preset created',
  });
  return castTasksPreset(preset);
};

/**
 * Delete specific tasks' preset
 *
 * @param id The id of the tasks' preset
 *
 * @returns The deleted tasks' preset
 */
export const deleteTasksPresetById = async (id: string): Promise<FullTasksPreset | null> => {
  const existingPreset = await getTasksPresetById(id);
  if (!existingPreset) {
    return null;
  }

  const preset = await prisma.taskPreset.delete({
    where: {
      id,
    },
    include: {
      template: templateInclude,
    },
  });

  logger.debug({
    id: preset.id,
    msg: 'Tasks\' preset deleted',
  });
  return castTasksPreset(preset);
};

/**
 * Edit specific tasks' preset
 *
 * @param id The id of the tasks' preset
 * @param data The new content of the tasks' preset
 *
 * @returns The edited tasks' preset
 */
export const editTasksPresetById = async (
  id: string,
  { template, ...data }: TasksPresetType,
): Promise<FullTasksPreset | null> => {
  const existingPreset = await getTasksPresetById(id);
  if (!existingPreset) {
    return null;
  }

  const preset = await prisma.taskPreset.update({
    where: {
      id,
    },
    data: {
      ...data,
      templateId: template,
    },
    include: {
      template: templateInclude,
    },
  });

  logger.debug({
    id: preset.id,
    msg: 'Tasks\' preset updated',
  });
  return castTasksPreset(preset);
};
