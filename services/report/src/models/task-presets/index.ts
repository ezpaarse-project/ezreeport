import type { Prisma } from '@ezreeport/database/types';
import { ensureSchema } from '@ezreeport/models/lib/zod';

import { appLogger } from '~/lib/logger';
import prisma from '~/lib/prisma';

import type { PaginationType } from '~/models/pagination/types';
import { buildPaginatedRequest } from '~/models/pagination';
import {
  type InputTaskPresetType,
  TaskPreset,
  type TaskPresetIncludeFieldsType,
  type TaskPresetQueryFiltersType,
  type TaskPresetType,
} from '~/models/task-presets/types';

const logger = appLogger.child({ model: 'task-presets', scope: 'models' });

function applyFilters(
  filters: TaskPresetQueryFiltersType
): Prisma.TaskPresetWhereInput {
  const where: Prisma.TaskPresetWhereInput = {
    templateId: filters.templateId,
  };

  if (filters.hidden != null) {
    where.hidden = filters.hidden;
    where.template = where.template || {};
    where.template.hidden = filters.hidden;
  }

  if (filters.query) {
    where.name = {
      contains: filters.query,
      mode: 'insensitive' as Prisma.QueryMode,
    };
  }

  return where;
}

function applyIncludes(
  fields: TaskPresetIncludeFieldsType[]
): Prisma.TaskPresetInclude {
  let template: Prisma.TemplateSelect | undefined;

  if (fields.includes('template.tags')) {
    template = template || {};
    template.tags = true;
  }

  if (fields.includes('template.locale')) {
    template = template || {};
    template.locale = true;
  }

  if (fields.includes('template.hidden')) {
    template = template || {};
    template.hidden = true;
  }

  return {
    template: template ? { select: template } : undefined,
  };
}

/**
 * Get all task presets
 *
 * @param filters Filters options
 * @param pagination Pagination options
 *
 * @returns All task presets following pagination
 */
export async function getAllTaskPresets(
  filters?: TaskPresetQueryFiltersType,
  include?: TaskPresetIncludeFieldsType[],
  pagination?: PaginationType
): Promise<TaskPresetType[]> {
  // Prepare Prisma query
  const prismaQuery: Prisma.TaskPresetFindManyArgs =
    buildPaginatedRequest(pagination);

  // Apply filters
  if (filters) {
    prismaQuery.where = {
      ...prismaQuery.where,
      ...applyFilters(filters),
    };
  }

  // Apply includes
  if (include) {
    prismaQuery.include = {
      ...prismaQuery.include,
      ...applyIncludes(include),
    };
  }

  // Fetch data
  const data = await prisma.taskPreset.findMany(prismaQuery);

  // Ensure data
  const presets = await Promise.all(
    data.map((preset) =>
      ensureSchema(
        TaskPreset,
        preset,
        () => `Failed to parse preset ${preset.id}`
      )
    )
  );
  return presets;
}

/**
 * Get one task preset
 *
 * @param id The preset's id
 *
 * @returns The found preset, or `null` if not found
 */
export async function getTaskPreset(
  id: string,
  include?: TaskPresetIncludeFieldsType[]
): Promise<TaskPresetType | null> {
  // Prepare Prisma query
  const prismaQuery: Prisma.TaskPresetFindUniqueArgs = { where: { id } };

  // Apply includes
  if (include) {
    prismaQuery.include = {
      ...prismaQuery.include,
      ...applyIncludes(include),
    };
  }

  const preset = await prisma.taskPreset.findUnique(prismaQuery);

  return preset && ensureSchema(TaskPreset, preset);
}

/**
 * Create a new task preset, throws if constraint is broken
 *
 * @param data The preset's data
 *
 * @returns The created preset
 */
export async function createTaskPreset(
  data: InputTaskPresetType & { id?: string }
): Promise<TaskPresetType> {
  const preset = await prisma.taskPreset.create({
    data: {
      ...data,

      template: { connect: { id: data.templateId } },
      templateId: undefined,
    },
  });

  logger.debug({
    action: 'Created',
    id: preset.id,
    msg: 'Created',
  });

  return ensureSchema(TaskPreset, preset);
}

/**
 * Edit a task preset, throws if preset doesn't exists or if constraint is broken
 *
 * @param id Preset's id
 * @param data The preset's data
 *
 * @returns The edited preset
 */
export async function editTaskPreset(
  id: string,
  data: InputTaskPresetType
): Promise<TaskPresetType> {
  const preset = await prisma.taskPreset.update({
    data: {
      ...data,

      template: { connect: { id: data.templateId } },
      templateId: undefined,
    },
    where: { id },
  });

  logger.debug({
    action: 'Updated',
    id: preset.id,
    msg: 'Updated',
  });

  return ensureSchema(TaskPreset, preset);
}

/**
 * Delete a task preset, throws if preset doesn't exists
 *
 * @param id Preset's id
 *
 * @returns The deleted preset
 */
export async function deleteTaskPreset(id: string): Promise<TaskPresetType> {
  const preset = await prisma.taskPreset.delete({ where: { id } });

  logger.debug({
    action: 'Deleted',
    id: preset.id,
    msg: 'Deleted',
  });

  return ensureSchema(TaskPreset, preset);
}

/**
 * Get count of presets
 *
 * @param filters Preset presets filters
 *
 * @returns Count of presets
 */
export async function countTaskPresets(
  filters?: TaskPresetQueryFiltersType
): Promise<number> {
  const prismaQuery: Prisma.TaskPresetCountArgs = {};

  // Apply filters
  if (filters) {
    prismaQuery.where = applyFilters(filters);
  }

  const result = await prisma.taskPreset.count({
    ...prismaQuery,
    select: { id: true },
  });

  return result.id;
}

/**
/**
 * Get if task preset exists
 *
 * @param id The preset's id
 *
 * @returns True if task exists
 */
export async function doesTaskPresetExist(id: string): Promise<boolean> {
  const count = await prisma.taskPreset.count({
    select: { id: true },
    where: { id },
  });

  return count.id > 0;
}
