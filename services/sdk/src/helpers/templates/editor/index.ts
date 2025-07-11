import objectHash from 'object-hash';
import type { InputTemplate, Template } from '~/modules/templates';

import type { TemplateTagMap } from './tags';
import {
  createTemplateBodyHelper,
  createTemplateBodyHelperFrom,
  templateHelperBodyToJSON,
  type TemplateBodyHelper,
} from './body';

export interface TemplateHelper {
  readonly id: string;
  name: string;
  body: TemplateBodyHelper;
  tags: TemplateTagMap;
  readonly createdAt: Date;
  readonly updatedAt?: Date;
  readonly hash: string;
}

function hashTemplate(template: Template | TemplateHelper): string {
  return objectHash({
    name: template.name,
    body: template.body,
    tags: template.tags,
  });
}

export function createTemplateHelper(
  name: string = '',
  body?: TemplateBodyHelper,
  tags: TemplateTagMap = new Map(),
  id: string = '',
  createdAt: Date = new Date(),
  updatedAt?: Date
): TemplateHelper {
  const template = {
    id,
    name,
    body: body ?? createTemplateBodyHelper(),
    tags,
    createdAt,
    updatedAt,
    hash: '',
  };

  template.hash = hashTemplate(template);

  return template;
}

export function createTemplateHelperFrom(template: Template): TemplateHelper {
  return createTemplateHelper(
    template.name,
    createTemplateBodyHelperFrom(template.body),
    new Map(template.tags?.map((tag) => [tag.name, tag]) ?? []),
    template.id,
    template.createdAt,
    template.updatedAt
  );
}

export function templateHelperToJSON(template: TemplateHelper): InputTemplate {
  return {
    name: template.name,
    body: templateHelperBodyToJSON(template.body),
    tags: Array.from(template.tags.values()),
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
