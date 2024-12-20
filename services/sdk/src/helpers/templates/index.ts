import { type Template, getTemplate, upsertTemplate } from '~/modules/templates';

import { assignDependencies } from '~/helpers/permissions/decorator';

export * from './editor';

/**
 * Change visibility of a template
 *
 * @param templateOrId Template or Template's id
 * @param hidden New state
 *
 * @returns Updated template
 */
export async function changeTemplateVisibility(
  templateOrId: Omit<Template, 'body'> | string,
  hidden: boolean,
): Promise<Template> {
  const base = await getTemplate(templateOrId);

  const template = await upsertTemplate({
    id: base.id,
    name: base.name,
    tags: base.tags,
    body: base.body,
    hidden,
  });

  return template;
}
assignDependencies(changeTemplateVisibility, [getTemplate, upsertTemplate]);
