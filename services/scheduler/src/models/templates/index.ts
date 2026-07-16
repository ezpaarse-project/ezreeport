import type { Prisma, Template } from '@ezreeport/database/types';

import config from '~/lib/config';
import prisma from '~/lib/prisma';

const { defaultTemplate } = config;

/**
 * Upsert default template
 *
 * @returns The default template
 */
export async function upsertDefaultTemplate(): Promise<Template> {
  const data: Prisma.TemplateCreateInput = {
    name: defaultTemplate.name,
    hidden: true,
    locale: defaultTemplate.locale,
    body: {
      version: 2,
      dateField: defaultTemplate.dateField,
      layouts: [],
    },
  };

  const template = await prisma.template.upsert({
    where: { name: defaultTemplate.name },
    update: data,
    create: data,
  });

  return template;
}
