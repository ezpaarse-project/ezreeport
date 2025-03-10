import { parse, Locale as VegaLocale, View } from 'vega';
import { compile, type TopLevelSpec } from 'vega-lite';
import type { Mark } from 'vega-lite/build/src/mark';
import { registerFont } from 'canvas';
import { compile as handlebars } from 'handlebars';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';
import localeFR from '~/lib/vega/locales/fr-FR.json';
import VegaLogger from '~/lib/vega/logger';

import type { FetchResultItem } from '~/models/fetch/results';

import type { CanvasRegisterableFont } from './types';
import {
  createArcSpec,
  createBarSpec,
  createLineSpec,
  createOtherSpec,
  type VegaParams,
  type Layer,
} from './layers';

export type Title = Exclude<Layer['title'], undefined>;

export type InputVegaParams = Omit<VegaParams, 'width' | 'height'> & { title: Title };

const { fontFamily, fonts } = config.report;

export const logger = appLogger.child({ scope: 'vega' });

export function initVegaEngine() {
  // Register fonts in Vega
  // eslint-disable-next-line no-restricted-syntax
  for (const { path, ...font } of fonts as CanvasRegisterableFont[]) {
    registerFont(path, font);
    logger.debug({
      path,
      font,
      msg: 'Registered font',
    });
  }
}

/**
 * Parse given title with handlebars vars. It's weird because Vega's title can be a lot of things
 *
 * @param title The Vega title
 * @param data The data given to the figure
 * @param dataKey The optional key to access data
 *
 * @returns The title to print
 */
export const parseTitle = (
  title: Title,
  data: FetchResultItem[],
): string | string[] => {
  const handlebarsOpts = { length: data.length };
  if (typeof title === 'string') {
    return handlebars(title)(handlebarsOpts);
  }
  if (Array.isArray(title)) {
    return title.map((t) => handlebars(t)(handlebarsOpts));
  }
  if (typeof title?.text === 'string') {
    return handlebars(title.text)(handlebarsOpts);
  }
  if (Array.isArray(title?.text)) {
    return title.text.map((t) => handlebars(t)(handlebarsOpts));
  }
  throw new Error('Unable to parse title: this format of params is not supported');
};

/**
 * Helper to create Vega-lite spec
 *
 * @param type Type of graph
 * @param data The data
 * @param params Graph options
 * @returns
 */
export const createVegaLSpec = (
  type: Mark,
  data: FetchResultItem[],
  params: VegaParams,
): TopLevelSpec => {
  let createSpec = createOtherSpec;
  switch (type) {
    case 'arc':
      createSpec = createArcSpec;
      break;
    case 'bar':
      createSpec = createBarSpec;
      break;
    case 'line':
    case 'area':
      createSpec = createLineSpec;
      break;

    default:
      break;
  }

  const { data: editedData, ...spec } = createSpec(type, data, params);

  return {
    width: Math.round(params.width),
    height: Math.round(params.height),
    background: 'transparent',

    datasets: { default: editedData || data },
    data: { name: 'default' },

    ...spec,

    config: {
      locale: localeFR as VegaLocale,
      customFormatTypes: true,
      font: fontFamily,
    },
  } as TopLevelSpec;
};

/**
 * Transform a Vega-lite spec into a Vega view. Useful when rendering.
 *
 * @param spec The Vega-lite spec
 * @returns The vega View
 */
export const createVegaView = (spec: TopLevelSpec): View => new View(parse(compile(spec).spec), { renderer: 'none' }).logger(new VegaLogger());
