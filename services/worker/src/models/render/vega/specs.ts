import type { Locale } from 'vega';
import type { TopLevelSpec } from 'vega-lite';
import type { Mark } from 'vega-lite/types_unstable/mark.js';

import config from '~/lib/config';
// oxlint-disable-next-line import/extensions
import localeFR from '~/lib/vega/locales/fr-FR.json' with { type: 'json' };

import type { FetchResultItem } from '~/models/fetch/results';

import {
  type VegaParams,
  createArcSpec,
  createBarSpec,
  createLineSpec,
  createOtherSpec,
} from './layers';

const { fontFamily } = config.report;

/**
 * Helper to create Vega-lite spec
 *
 * @param type Type of graph
 * @param data The data
 * @param params Graph options
 *
 * @returns The spec
 */
export const createVegaLSpec = (
  type: Mark,
  data: FetchResultItem[],
  params: VegaParams
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
    background: 'transparent',

    data: { name: 'default' },
    datasets: { default: editedData || data },

    height: Math.round(params.height),
    width: Math.round(params.width),

    ...spec,

    config: {
      customFormatTypes: true,
      font: fontFamily,
      locale: localeFR as Locale,
    },
  } as TopLevelSpec;
};
