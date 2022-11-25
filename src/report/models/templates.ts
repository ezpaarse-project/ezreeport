import type { Recurrence } from '@prisma/client';
import Joi from 'joi';
import { AnyFigure, AnyFigureFnc, figureSchema } from './figures';

export type Template = Array<AnyFigureFnc | Promisify<AnyFigureFnc>>;

export type TemplateFnc = (
  task: {
    recurrence: Recurrence,
    period: Interval,
    institution: ElasticInstitution
    user: string
  },
  dataOpts: unknown
) => Template | Promise<Template>;

export type TemplateJSON = {
  extends: string
  data?: object // Template dependent
  inserts?: Array<{
    at: number,
    figures: AnyFigure[] | AnyFigure
  }>
};

export const templateSchema = Joi.object<TemplateJSON>({
  extends: Joi.string().trim().required(),
  data: Joi.object(),
  inserts: Joi.array().items(
    Joi.object({
      at: Joi.number().min(0).integer().required(),
      figures: [
        figureSchema.required(),
        Joi.array().items(figureSchema).required(),
      ],
    }),
  ),
});

/**
 * Check if input data is a valid TemplateJSON
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 *
 * @throw If input data isn't a valid TemplateJSON
 */
export const isValidTemplate = (data: unknown): data is TemplateJSON => {
  const validation = templateSchema.validate(data, {});
  if (validation.error != null) {
    throw new Error(`Task's template is not valid: ${validation.error.message}`);
  }
  return true;
};
