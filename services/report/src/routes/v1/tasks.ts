import type { FastifyPluginAsync } from 'fastify';
import { StatusCodes } from 'http-status-codes';

import { assertIsSchema, Type, type Static } from '~/lib/typebox';
import { addTaskToGenQueue } from '~/lib/bull';
import { b64ToString } from '~/lib/utils';

import authPlugin from '~/plugins/auth';

import { Access } from '~/models/access';
import * as tasks from '~/models/tasks';
import { getTemplateById, linkTaskToTemplate, unlinkTaskFromTemplate } from '~/models/templates';
import { ArgumentError, NotFoundError, ConflictError } from '~/types/errors';

import { getTasksPresetById } from '~/models/tasksPresets';

const router: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authPlugin, { prefix: 'tasks' });

  /**
   * List all active tasks of authed user's namespace.
   */
  fastify.get<{
    Querystring: tasks.TaskPaginationQueryType
  }>(
    '/',
    {
      schema: {
        querystring: tasks.TaskPaginationQuery,
      },
      ezrAuth: {
        access: Access.READ,
      },
    },
    async (request) => {
      const pagination = {
        count: request.query.count ?? 15,
        sort: (request.query.sort ?? 'createdAt'),
        previous: request.query.previous ?? undefined,
      };

      const list = await tasks.getAllTasks(pagination, request.namespaceIds);

      return {
        content: list,
        meta: {
          total: await tasks.getCountTask(request.namespaceIds),
          count: list.length,
          size: pagination.count,
          lastId: list.at(-1)?.id,
        },
      };
    },
  );

  /**
   * Create a new task
   */
  fastify.post<{
    Body: Static<typeof tasks.CreateTaskBody>
  }>(
    '/',
    {
      schema: {
        body: tasks.CreateTaskBody,
      },
      ezrAuth: {
        access: Access.READ_WRITE,
      },
      preHandler: async (request) => {
        // Check if namespace is valid
        if (!request.namespaceIds?.includes(request.body.namespace)) {
          throw new ArgumentError("The provided namespace doesn't exist or you don't have access to this namespace");
        }
      },
    },
    async (request, reply) => {
      reply.code(StatusCodes.CREATED);
      return {
        content: await tasks.createTask(
          request.body,
          request.user?.username ?? '',
        ),
      };
    },
  );

  const SpecificPresetParams = Type.Object({
    presetId: Type.String({ minLength: 1 }),
  });
  type SpecificPresetParamsType = Static<typeof SpecificPresetParams>;

  /**
   * Create a new task from a preset
   */
  fastify.post<{
    Body: tasks.AdditionalDataForPresetType,
    Params: SpecificPresetParamsType,
  }>(
    '/_from-preset/:presetId',
    {
      schema: {
        body: tasks.AdditionalDataForPreset,
        params: SpecificPresetParams,
      },
      ezrAuth: {
        access: Access.READ_WRITE,
      },
      preHandler: async (request) => {
        // Check if namespace is valid
        if (!request.namespaceIds?.includes(request.body.namespace)) {
          throw new ArgumentError("The provided namespace doesn't exist or you don't have access to this namespace");
        }
      },
    },
    async (request, reply) => {
      const preset = await getTasksPresetById(request.params.presetId);
      if (!preset) {
        throw new NotFoundError("The provided preset doesn't exist");
      }

      if (!request.user?.isAdmin && preset.hidden) {
        throw new NotFoundError("The provided preset doesn't exist");
      }

      reply.code(StatusCodes.CREATED);
      return {
        content: await tasks.createTaskFromPreset(
          preset,
          request.body,
          request.user?.username ?? '',
        ),
      };
    },
  );

  /**
   * Get all targets of all tasks
   */
  fastify.get(
    '/_targets',
    {
      ezrAuth: {
        access: Access.READ,
      },
    },
    async (request) => {
      const list = await tasks.getAllTargets(request.namespaceIds);

      return { content: list };
    },
  );

  const SpecificEmailParams = Type.Object({
    email: Type.String({ minLength: 1 }),
  });
  type SpecificEmailParamsType = Static<typeof SpecificEmailParams>;

  /**
   * Get all tasks of a target
   */
  fastify.get<{
    Querystring: tasks.TaskPaginationQueryType
    Params: SpecificEmailParamsType,
  }>(
    '/_targets/:email/tasks',
    {
      schema: {
        querystring: tasks.TaskPaginationQuery,
        params: SpecificEmailParams,
      },
      ezrAuth: {
        access: Access.READ,
      },
    },
    async (request) => {
      const pagination = {
        count: request.query.count ?? 15,
        sort: (request.query.sort ?? 'createdAt'),
        previous: request.query.previous ?? undefined,
      };

      const list = await tasks.getTasksByTarget(
        request.params.email,
        pagination,
        request.namespaceIds,
      );

      return {
        content: list,
        meta: {
          total: await tasks.getTaskCountByTarget(request.params.email, request.namespaceIds),
          count: list.length,
          size: pagination.count,
          lastId: list.at(-1)?.id,
        },
      };
    },
  );

  const SpecificTaskParams = Type.Object({
    task: Type.String({ minLength: 1 }),
  });
  type SpecificTaskParamsType = Static<typeof SpecificTaskParams>;

  /**
   * Unsubscribe a target from a task
   */
  fastify.delete<{
    Params: SpecificEmailParamsType & SpecificTaskParamsType,
  }>(
    '/_targets/:email/tasks/:task',
    {
      schema: {
        params: SpecificEmailParams,
      },
      ezrAuth: {
        access: Access.READ_WRITE,
      },
    },
    async (request) => {
      const { email, task: id } = request.params;

      const item = await tasks.getTaskById(id, request.namespaceIds);
      if (!item) {
        throw new NotFoundError(`Task with id '${id}' not found`);
      }

      const emailIndex = item.targets.findIndex((target: string) => email === target);
      if (emailIndex < 0) {
        return;
      }
      item.targets.splice(emailIndex, 1);

      await tasks.patchTaskByIdWithHistory(
        item.id,
        { targets: item.targets },
        {
          type: 'unsubscription',
          message: `${email} a été désinscrit de la liste de diffusion par ${request.user?.username || 'Unknown'}.`,
        },
      );
    },
  );

  /**
   * Get specific task
   */
  fastify.get<{
    Params: SpecificTaskParamsType
  }>(
    '/:task',
    {
      schema: {
        params: SpecificTaskParams,
      },
      ezrAuth: {
        access: Access.READ,
      },
    },
    async (request) => {
      const { task: id } = request.params;

      const item = await tasks.getTaskById(id, request.namespaceIds);
      if (!item) {
        throw new NotFoundError(`Task with id '${id}' not found for allowed namespace(s)`);
      }

      return { content: item };
    },
  );

  /**
   * Update or create a task
   */
  const UpsertTaskBody = Type.Union([
    tasks.InputTaskBody,
    tasks.CreateTaskBody,
  ]);
  fastify.put<{
    Params: SpecificTaskParamsType,
    Body: Static<typeof UpsertTaskBody>
  }>(
    '/:task',
    {
      schema: {
        params: SpecificTaskParams,
        body: UpsertTaskBody,
      },
      ezrAuth: {
        access: Access.READ_WRITE,
      },
    },
    async (request, reply) => {
      const { task: id } = request.params;

      const item = await tasks.getTaskById(id, request.namespaceIds);
      // If task doesn't exist yet, we need to create it
      if (!item) {
        // As body can be both types, we need to assert the correct type
        assertIsSchema(tasks.CreateTaskBody, request.body);

        // Check if namespace is valid
        if (!request.namespaceIds?.includes(request.body.namespace)) {
          throw new ArgumentError("The provided namespace doesn't exist or you don't have access to this namespace");
        }

        reply.status(StatusCodes.CREATED);
        return {
          content: await tasks.createTask(request.body, request.user?.username ?? '', id),
        };
      }
      // If task already exist, we need to update it

      // As body can be both types, we need to assert the correct type
      assertIsSchema(tasks.InputTaskBody, request.body);

      return {
        content: await tasks.patchTaskById(
          id,
          request.body,
          request.user?.username ?? '',
          request.namespaceIds,
        ),
      };
    },
  );

  /**
   * Delete a task
  */
  fastify.delete<{
    Params: SpecificTaskParamsType,
  }>(
    '/:task',
    {
      schema: {
        params: SpecificTaskParams,
      },
      ezrAuth: {
        access: Access.READ_WRITE,
      },
    },
    async (request) => {
      const { task: id } = request.params;

      await tasks.deleteTaskById(id, request.namespaceIds);
    },
  );

  /**
   * Shorthand to quickly enable a task
   */
  fastify.put<{
    Params: SpecificTaskParamsType,
  }>(
    '/:task/_enable',
    {
      schema: {
        params: SpecificTaskParams,
      },
      ezrAuth: {
        access: Access.READ_WRITE,
      },
    },
    async (request) => {
      const { task: id } = request.params;

      const item = await tasks.patchTaskByIdWithHistory(
        id,
        { enabled: true },
        {
          type: 'edition',
          message: `Tâche activée par ${request.user?.username}`,
        },
        request.namespaceIds,
      );

      if (!item) {
        throw new NotFoundError(`Task with id '${id}' not found for allowed namespace(s)`);
      }

      return { content: item };
    },
  );

  /**
   * Shorthand to quickly disable a task
   */
  fastify.put<{
    Params: SpecificTaskParamsType,
  }>(
    '/:task/_disable',
    {
      schema: {
        params: SpecificTaskParams,
      },
      ezrAuth: {
        access: Access.READ_WRITE,
      },
    },
    async (request) => {
      const { task: id } = request.params;

      const item = await tasks.patchTaskByIdWithHistory(
        id,
        { enabled: false },
        {
          type: 'edition',
          message: `Tâche désactivée par ${request.user?.username}`,
        },
        request.namespaceIds,
      );

      if (!item) {
        throw new NotFoundError(`Task with id '${id}' not found for allowed namespace(s)`);
      }

      return { content: item };
    },
  );

  /**
   * Link a task to a template
   */
  const LinkTaskTemplateParams = Type.Intersect([
    SpecificTaskParams,
    Type.Object({
      template: Type.String({ minLength: 1 }),
    }),
  ]);
  fastify.put<{
    Params: Static<typeof LinkTaskTemplateParams>,
  }>(
    '/:task/_link/:template',
    {
      schema: {
        params: LinkTaskTemplateParams,
      },
      ezrAuth: {
        access: Access.READ_WRITE,
      },
    },
    async (request) => {
      const { task: taskId, template: templateId } = request.params;

      const taskItem = await tasks.getTaskById(taskId, request.namespaceIds);
      if (!taskItem) {
        throw new NotFoundError(`Task with id '${taskId}' not found for allowed namespace(s)`);
      }

      const templateItem = await getTemplateById(templateId);
      if (!templateItem) {
        throw new NotFoundError(`Template with id '${templateId}' not found`);
      }

      if (!taskItem.lastExtended) {
        throw new ConflictError(`Task with id '${taskId}' is already linked to a template`);
      }

      await linkTaskToTemplate(
        taskId,
        templateId,
        request.user?.username ?? '',
      );

      return {
        content: await tasks.getTaskById(taskId, request.namespaceIds),
      };
    },
  );

  /**
   * Unlink a task from it's template
   */
  fastify.delete<{
    Params: Static<typeof LinkTaskTemplateParams>,
  }>(
    '/:task/_link/:template',
    {
      schema: {
        params: LinkTaskTemplateParams,
      },
      ezrAuth: {
        access: Access.READ_WRITE,
      },
    },
    async (request) => {
      const { task: taskId, template: templateId } = request.params;

      const taskItem = await tasks.getTaskById(taskId, request.namespaceIds);
      if (!taskItem) {
        throw new NotFoundError(`Task with id '${taskId}' not found for allowed namespace(s)`);
      }

      if (taskItem.extends.id !== templateId) {
        throw new NotFoundError(`Task with id '${taskId}' is not linked with template '${templateId}'`);
      }

      if (taskItem.lastExtended) {
        throw new ConflictError(`Task with id '${taskId}' is already unlinked`);
      }

      await unlinkTaskFromTemplate(
        taskId,
        request.user?.username ?? '',
      );
    },
  );

  /**
   * Force generation of report
   *
   * Parameter `test_emails` overrides task emails & enable first level of debug
   * Parameter `debug` is not accessible in PROD and enable second level of debug
   */
  const GenerateTaskQuery = Type.Partial(
    Type.Object({
      period_start: Type.String({ minLength: 1 }),
      period_end: Type.String({ minLength: 1 }),
      test_emails: Type.Union([
        Type.Array(
          Type.String({ format: 'email' }),
          { minItems: 1 },
        ),
        Type.String({ format: 'email' }),
      ]),
      'test_emails[]': Type.Union([
        Type.Array(
          Type.String({ format: 'email' }),
          { minItems: 1 },
        ),
        Type.String({ format: 'email' }),
      ]),
      debug: Type.Any(),
    }),
  );
  fastify.post<{
    Params: SpecificTaskParamsType,
    Querystring: Static<typeof GenerateTaskQuery>
  }>(
    '/:task/_run',
    {
      schema: {
        params: SpecificTaskParams,
        querystring: GenerateTaskQuery,
      },
      ezrAuth: {
        access: Access.READ_WRITE,
      },
    },
    async (request) => {
      const { task: id } = request.params;
      const {
        period_start: periodStart,
        period_end: periodEnd,
      } = request.query;

      const item = await tasks.getTaskById(id, request.namespaceIds);
      if (!item) {
        throw new NotFoundError(`Task with id '${id}' not found for allowed namespace(s)`);
      }

      // Parse emails
      let testEmails = request.query.test_emails || request.query['test_emails[]'] || [];
      if (!Array.isArray(testEmails)) {
        testEmails = [testEmails];
      }

      // Parse custom period
      let customPeriod: { start: string, end: string } | undefined;
      if (periodStart || periodEnd) {
        if (!(periodStart && periodEnd)) {
          throw new ArgumentError('Missing part of custom period');
        }
        customPeriod = {
          start: periodStart.toString(),
          end: periodEnd.toString(),
        };
      }

      const flow = await addTaskToGenQueue({
        task: {
          ...item,
          extendedId: item.extends.id,
          namespaceId: item.namespace.id,
          targets: testEmails || item.targets,
        },
        namespace: item.namespace,
        customPeriod,
        origin: request.user?.username ?? '',
        writeActivity: testEmails.length <= 0,
        debug: !!request.query.debug && process.env.NODE_ENV !== 'production',
      });
      const job = flow.children?.[0].job;

      return {
        content: {
          id: job?.id,
          queue: 'generation',
          data: job?.data,
        },
      };
    },
  );

  /**
   * Shorthand to remove given email in given task
   */
  const UnsubscribeBody = Type.Object({
    unsubId: Type.String(),
    email: Type.String({ format: 'email' }),
  });
  fastify.put<{
    Params: SpecificTaskParamsType,
    Body: Static<typeof UnsubscribeBody>,
  }>(
    '/:task/_unsubscribe',
    {
      schema: {
        params: SpecificTaskParams,
        body: UnsubscribeBody,
      },
    },
    async (request) => {
      const { task: id } = request.params;

      const [taskId64, to64] = decodeURIComponent(request.body.unsubId).split(':');
      if (id !== b64ToString(taskId64) || request.body.email !== b64ToString(to64)) {
        throw new ArgumentError('Integrity check failed');
      }

      const item = await tasks.getTaskById(id);
      if (!item) {
        throw new NotFoundError(`Task with id '${id}' not found`);
      }

      const emailIndex = item.targets.findIndex((email: string) => email === request.body.email);
      if (emailIndex < 0) {
        throw new ArgumentError(`Email "${request.body.email}" not found in targets of task "${item.id}"`);
      }
      item.targets.splice(emailIndex, 1);

      await tasks.patchTaskByIdWithHistory(
        item.id,
        { targets: item.targets },
        {
          type: 'unsubscription',
          message: `${request.body.email} s'est désinscrit de la liste de diffusion.`,
        },
      );

      return {
        content: await tasks.getTaskById(id),
      };
    },
  );
};

export default router;
