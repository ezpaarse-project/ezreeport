import type { TemplateBodyFigure } from '~/modules/templates';
import { type FigureHelperWithData, createFigureHelperWithData } from './base';

export interface MdFigure extends FigureHelperWithData {
  readonly type: 'md';
  data: string;
  readonly params: Record<string, never>;
}

export function createMdFigureHelper(data = '', slots?: number[]): MdFigure {
  return createFigureHelperWithData('md', data, {}, slots);
}

export function createMdFigureHelperFrom(figure: TemplateBodyFigure): MdFigure {
  const data = typeof figure.data === 'string' ? figure.data : '';
  return createMdFigureHelper(data, figure.slots);
}

export function mdHelperParamsToJSON(
  params: MdFigure['params']
): TemplateBodyFigure['params'] {
  return params;
}
