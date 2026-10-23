// oxlint-disable-next-line import/no-namespace
import type * as vegaModule from 'vega';
// oxlint-disable-next-line import/no-namespace
import type * as vegaLiteModule from 'vega-lite';
import { registerFont } from 'canvas';
import chroma from 'chroma-js';
import { compile as handlebars } from 'handlebars';

import config from '~/lib/config';
import { appLogger } from '~/lib/logger';
import { VegaLogger } from '~/lib/vega/logger';

import type { FetchResultItem } from '~/models/fetch/results';
import TemplateError from '~/models/generation/errors';

import type { Title, VegaParams } from './layers';
import type { CanvasRegisterableFont } from './types';

const { fonts, scheme } = config.report;

let vega: typeof vegaModule | null = null;
let vegaLite: typeof vegaLiteModule | null = null;

const schemes = {
  colors: { name: scheme, values: [] as string[] },
  labels: { name: `${scheme}.labels`, values: [] as string[] },
};

export type InputVegaParams = Omit<VegaParams, 'width' | 'height'> & {
  title: Title;
};

export const logger = appLogger.child({ scope: 'vega' });

export async function initVegaEngine(): Promise<void> {
  // Register fonts in Vega
  for (const { path, ...font } of fonts as CanvasRegisterableFont[]) {
    registerFont(path, font);
    logger.debug({
      font,
      msg: 'Registered font',
      path,
    });
  }

  // Using dynamic imports to avoid issues with top level awaits
  vega = await import('vega');
  vegaLite = await import('vega-lite');

  // Register schemes
  schemes.colors.values = vega.scheme(schemes.colors.name) as string[];
  schemes.labels.values = schemes.colors.values.map((color) =>
    // oxlint-disable-next-line import/no-named-as-default-member
    chroma.contrast(color, 'black') > 5 ? 'black' : 'white'
  );
  vega.scheme(schemes.labels.name, schemes.labels.values);
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
  data: FetchResultItem[]
): string | string[] => {
  const handlebarsOpts = { length: data.length };
  if (typeof title === 'string') {
    return handlebars(title)(handlebarsOpts);
  }
  if (Array.isArray(title)) {
    return title.map((el) => handlebars(el)(handlebarsOpts));
  }
  if (typeof title?.text === 'string') {
    return handlebars(title.text)(handlebarsOpts);
  }
  if (Array.isArray(title?.text)) {
    return title.text.map((el) => handlebars(el)(handlebarsOpts));
  }
  throw new TemplateError(
    'Unable to parse title: this format of params is not supported',
    'ParameterFormatError'
  );
};

/**
 * Transform a Vega-lite spec into a Vega view. Useful when rendering.
 *
 * @param spec The Vega-lite spec
 * @returns The vega View
 */
export const createVegaView = (
  spec: vegaLiteModule.TopLevelSpec
): vegaModule.View => {
  if (!vega || !vegaLite) {
    throw new Error('Vega Engine not initialised');
  }

  return new vega.View(vega.parse(vegaLite.compile(spec).spec), {
    renderer: 'none',
  }).logger(new VegaLogger());
};

export const getVegaScheme = (): typeof schemes => {
  if (!vega) {
    throw new Error('Vega Engine not initialised');
  }

  return schemes;
};
