import type { Prisma } from '@prisma/client';
import Joi from 'joi';
import type { Fetchers } from '~/generators/fetchers';
import fetchers from '~/generators/fetchers';
import { ArgumentError } from '~/types/errors';
import { AnyFigure, figureSchema } from './figures';

/**
 * Layout is a page of report
 */
export interface NewLayout<
 F extends keyof Fetchers,
> {
  /**
  * Data that will be rendered. Must be present when renderer is called.
  *
  * Can be present only if fetcher isn't
  */
  data?: Prisma.JsonValue,
  /**
  * Name of the fetcher
  *
  * @see {fetchers} For more info
  */
  fetcher?: F,
  /**
  * Options passed to the fetcher.
  * Can be present if fetcher is
  *
  * Override template `fetchOptions`.
  * Overrided by default `fetchOptions`.
  *
  * @see {fetchers} For more info
  */
  fetchOptions?: Omit<GeneratorParam<Fetchers, F>, 'period'>,
  /**
  * Figures description passed to renderer
  */
  figures: AnyFigure[],
}

export type AnyLayout = NewLayout<keyof Fetchers>;

export const layoutSchema = Joi.object<AnyLayout>({
  data: Joi.any(),
  fetcher: Joi.string().allow(...Object.keys(fetchers)),
  fetchOptions: Joi.object(),
  figures: Joi.array().items(figureSchema).required(),
});

/**
 * Check if input data is a layout
 *
 * @param data The input data
 * @returns `true` if valid
 *
 * @throws If not valid
 */
export const isNewLayout = (data: unknown): data is AnyLayout => {
  const validation = layoutSchema.validate(data, {});
  if (validation.error != null) {
    throw new ArgumentError(`Layout is not valid: ${validation.error.message}`);
  }
  return true;
};
