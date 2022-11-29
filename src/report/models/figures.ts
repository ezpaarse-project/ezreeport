import Joi from 'joi';
import type { Mark } from 'vega-lite/build/src/mark';
import type { InputMdParams } from '../lib/markdown';
import type { InputMetricParams, MetricData } from '../lib/metrics';
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

export type AnyFigureFnc = () => AnyFigure | AnyFigure[];

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

/**
 * Check if the given figure is a table
 *
 * @param figure The figure
 * @returns Is the figure is a table
 */
export const isFigureTable = (figure: AnyFigure): figure is Figure<'table'> => figure.type === 'table';

/**
 * Check if the given figure is a text
 *
 * @param figure The figure
 * @returns Is the figure is a text
 */
export const isFigureMd = (figure: AnyFigure): figure is Figure<'md'> => figure.type === 'md';

/**
 * Check if the given figure is a metric
 *
 * @param figure The figure
 * @returns Is the figure is a metric
 */
export const isFigureMetric = (figure: AnyFigure): figure is Figure<'metric'> => figure.type === 'metric';
