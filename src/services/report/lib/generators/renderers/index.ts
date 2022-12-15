import vegaPDFRenderer from './vega-pdf';

/**
 * List of renderers implemented.
 *
 * First param is an object that can have any option
 * Second param is a event emitter
 * Can return anything (but something)
 */
const renderers = {
  'vega-pdf': vegaPDFRenderer,
} as const;
export type Renderers = typeof renderers;

export default renderers;
