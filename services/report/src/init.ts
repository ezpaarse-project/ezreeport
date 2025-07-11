import { appLogger } from '~/lib/logger';
import config from '~/lib/config';

import { upsertDefaultTemplate } from '~/models/templates';

const { name: defaultTemplateName } = config.defaultTemplate;

const logger = appLogger.child({ scope: 'init' });

/**
 * Add default template if not already present
 */
export async function initTemplates(): Promise<void> {
  try {
    const { id } = await upsertDefaultTemplate();
    config.defaultTemplate.id = id;
    logger.info({
      defaultTemplateName,
      defaultTemplateId: id,
      msg: 'Default template ready',
    });
  } catch (error) {
    logger.error(error, "Couldn't upsert default template");
  }
}
