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
