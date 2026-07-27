import objectHash from 'object-hash';

import type {
  InputTemplate,
  Template,
  TemplateLocale,
} from '~/modules/templates';

import type { TemplateTagMap } from './tags';
import {
  type TemplateBodyHelper,
  createTemplateBodyHelper,
  createTemplateBodyHelperFrom,
  templateHelperBodyToJSON,
} from './body';

export interface TemplateHelper {
  readonly id: string;
  name: string;
  locale: 'fr' | 'en';
  body: TemplateBodyHelper;
  tags: TemplateTagMap;
  readonly createdAt: Date;
  readonly updatedAt?: Date;
  readonly hash: string;
}

function hashTemplate(template: Template | TemplateHelper): string {
  return objectHash({
    body: template.body,
    locale: template.locale,
    name: template.name,
    tags: template.tags,
  });
}

export function createTemplateHelper(
  name: string = '',
  body?: TemplateBodyHelper,
  locale: TemplateLocale = 'en',
  tags: TemplateTagMap = new Map(),
  id: string = '',
  createdAt: Date = new Date(),
  updatedAt?: Date
): TemplateHelper {
  const template = {
    body: body ?? createTemplateBodyHelper(),
    createdAt,
    hash: '',
    id,
    locale,
    name,
    tags,
    updatedAt,
  };

  template.hash = hashTemplate(template);

  return template;
}

export function createTemplateHelperFrom(template: Template): TemplateHelper {
  return createTemplateHelper(
    template.name,
    createTemplateBodyHelperFrom(template.body),
    template.locale,
    new Map(template.tags?.map((tag) => [tag.id, tag])),
    template.id,
    template.createdAt,
    template.updatedAt
  );
}

export function templateHelperToJSON(template: TemplateHelper): InputTemplate {
  return {
    body: templateHelperBodyToJSON(template.body),
    locale: template.locale,
    name: template.name,
    tags: [...template.tags.values()],
  };
}

export function hasTemplateChanged(template: TemplateHelper): boolean {
  return template.hash !== hashTemplate(template);
}

export {
  type TemplateBodyHelper,
  createTemplateBodyHelper,
  createTemplateBodyHelperFrom,
  addLayoutOfHelper,
  removeLayoutOfHelper,
  updateLayoutOfHelper,
} from './body';
export * from './tags';
