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
    body: {
      dateField: defaultTemplate.dateField,
      layouts: [],
      version: 2,
    },
    hidden: true,
    locale: defaultTemplate.locale,
    name: defaultTemplate.name,
  };

  const template = await prisma.template.upsert({
    create: data,
    update: data,
    where: { name: defaultTemplate.name },
  });

  return template;
}
