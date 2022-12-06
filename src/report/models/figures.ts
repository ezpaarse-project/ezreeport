import Joi from 'joi';
import type { Mark } from 'vega-lite/build/src/mark';
import type { InputMdParams } from '../lib/pdf/markdown';
import type { InputMetricParams, MetricData } from '../lib/pdf/metrics';
import type { TableParams } from '../lib/pdf/table';
import type { InputVegaParams } from '../lib/vega';

type FigureType = Mark | 'table' | 'md' | 'metric';

interface FigureParams extends Record<FigureType, object> {
  table: TableParams,
  md: InputMdParams,
  metric: InputMetricParams
}

interface FigureData extends Record<FigureType, unknown[]> {
  metric: MetricData[]
}

/**
 * Figure definition
 */
export interface Figure<Type extends FigureType> {
  type: Type;
  /**
   * Data specific to figure
   *
   * Override layout's data
   */
  data?: Type extends 'md' ? string : FigureData[Type];
  params: Type extends Mark ? InputVegaParams : FigureParams[Type];
  slots?: number[]
}

/**
 * Global figure definition
 */
export type AnyFigure = Figure<Mark> | Figure<'table'> | Figure<'md'> | Figure<'metric'>;

/**
 * Joi validation
 */
export const figureSchema = Joi.object<AnyFigure>({
  type: Joi.string<FigureType>().required(),
  data: [
    Joi.string().required(),
    Joi.array().items(Joi.any()).required(),
  ],
  params: Joi.object().required(),
  slots: Joi.array().items(Joi.number()),
});
