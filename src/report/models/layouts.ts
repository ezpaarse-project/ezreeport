import type { Recurrence } from '@prisma/client';
import Joi from 'joi';
import { AnyFigure, AnyFigureFnc, figureSchema } from './figures';

export type Layout = Array<AnyFigureFnc | Promisify<AnyFigureFnc>>;

export type LayoutFnc = (
  task: {
    recurrence: Recurrence,
    period: Interval,
    institution: ElasticInstitution
    user: string
  },
  dataOpts: unknown
) => Layout | Promise<Layout>;

export type LayoutJSON = {
  extends: string
  data?: object // Layout dependent
  inserts?: Array<{
    at: number,
    figures: AnyFigure[] | AnyFigure
  }>
};

export const layoutSchema = Joi.object<LayoutJSON>({
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
 * Check if input data is a valid LayoutJSON
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 *
 * @throw If input data isn't a valid LayoutJSON
 */
export const isValidLayout = (data: unknown): data is LayoutJSON => {
  const validation = layoutSchema.validate(data, {});
  if (validation.error != null) {
    throw new Error(`Task's layout is not valid: ${validation.error.message}`);
  }
  return true;
};
