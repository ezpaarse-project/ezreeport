import { appLogger } from '~/lib/logger';
import config from '~/lib/config';
import { createTemplate, getTemplateByName } from '~/models/templates';
import { createNamespace, getCountNamespaces } from '~/models/namespaces';

const { name: defaultTemplateName } = config.defaultTemplate;

const logger = appLogger.child({ scope: 'init' });

/**
 * Add default template if not already present
 */
export const initTemplates = async () => {
  logger.debug({
    defaultTemplateName,
    msg: 'Checking existence of default template',
  });
  let template;
  try {
    template = await getTemplateByName(defaultTemplateName);
  } catch (error) {
    logger.error(error, 'Couldn\'t get default template');
    return;
  }

  if (template) {
    config.defaultTemplate.id = template.id;
    logger.debug({
      defaultTemplateName,
      defaultTemplateId: template.id,
      msg: 'Default template found',
    });
    return;
  }

  logger.debug({
    defaultTemplateName,
    msg: 'Default template not found, creating it...',
  });
  try {
    const { id } = await createTemplate(
      { name: defaultTemplateName, body: { layouts: [], dateField: '' }, tags: [] },
    );
    config.defaultTemplate.id = id;
    logger.info({
      defaultTemplateName,
      defaultTemplateId: id,
      msg: 'Default template created',
    });
  } catch (error) {
    logger.error(error, 'Couldn\'t create default template');
  }
};

/**
 * Add default namespace if needed
 */
export const initNamespaces = async () => {
  // Getting count of namespaces
  let count = 0;
  try {
    logger.debug('Checking count of namespaces...');
    count = await getCountNamespaces();
    logger.debug({
      namespaceCount: count,
      msg: 'Namespaces found',
    });
  } catch (error) {
    logger.error(error, 'Couldn\'t get count of namespaces');
  }

  // Insert default template if needed
  if (count > 0) {
    return;
  }
  logger.debug('Creating default namespace');
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
    logger.error(error, 'Couldn\'t create default namespace');
  }
};
