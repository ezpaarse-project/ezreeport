import { appLogger } from '~/lib/logger';
import config from '~/lib/config';
import { createTemplate, getTemplateByName } from '~/models/templates';
import { createNamespace, getCountNamespaces } from './models/namespaces';

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
    if (error instanceof Error) {
      appLogger.error(`[init] Couldn't get template [${defaultTemplateName}]: {${error.message}}`);
    } else {
      appLogger.error(`[init] An unexpected error occurred when getting template [${defaultTemplateName}]: {${error}}`);
    }
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
    if (error instanceof Error) {
      appLogger.error(`[init] Couldn't create template [${defaultTemplateName}]: {${error.message}}`);
    } else {
      appLogger.error(`[init] An unexpected error occurred when creating template [${defaultTemplateName}]: {${error}}`);
    }
  }
};

/**
 * Add default namespace if needed
 */
export const initNamespaces = async () => {
  // Getting count of namespaces
  let count = 0;
  try {
    appLogger.verbose('[init] Checking count of namespaces...');
    count = await getCountNamespaces();
    appLogger.verbose(`[init] Found [${count}] namespaces`);
  } catch (error) {
    if (error instanceof Error) {
      appLogger.error(`[init] Couldn't get count of namespaces: {${error.message}}`);
    } else {
      appLogger.error(`[init] An unexpected error occurred when getting count of namespaces: {${error}}`);
    }
  }

  // Insert default template if needed
  if (count <= 0) {
    appLogger.verbose('[init] Creating default namespace');
    try {
      await createNamespace(
        '_',
        {
          fetchLogin: {},
          fetchOptions: {},
          name: 'default',
        },
      );
    } catch (error) {
      if (error instanceof Error) {
        appLogger.error(`[init] Couldn't create namespace [_]: {${error.message}}`);
      } else {
        appLogger.error(`[init] An unexpected error occurred when creating namespace [_]: {${error}}`);
      }
    }
  }
};
