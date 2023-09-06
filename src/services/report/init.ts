import { appLogger } from '~/lib/logger';
import config from '~/lib/config';
import { createTemplate, getTemplateByName } from '~/models/templates';

const { name: defaultTemplateName } = config.defaultTemplate;

/**
 * Add default template if not already present
 */
export const initTemplates = async () => {
  appLogger.verbose(`[init] Checking existence of [${defaultTemplateName}]...`);
  let template;
  try {
    template = await getTemplateByName(defaultTemplateName);
  } catch (error) {
    appLogger.error(`[init] Couldn't get template [${defaultTemplateName}]:`, (error as Error).message);
    return;
  }

  if (template) {
    config.defaultTemplate.id = template.id;
    appLogger.verbose(`[init] Template [${defaultTemplateName}] found`);
    return;
  }

  appLogger.verbose(`[init] Template [${defaultTemplateName}] not found, creating it...`);
  try {
    const { id } = await createTemplate(
      { name: defaultTemplateName, body: { layouts: [] }, tags: [] },
    );
    config.defaultTemplate.id = id;
    appLogger.info(`[init] Template [${defaultTemplateName}] created`);
  } catch (error) {
    appLogger.error(`[init] Couldn't create template [${defaultTemplateName}]:`, (error as Error).message);
  }
};

export default {
  initTemplates,
};
