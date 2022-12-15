import { templates } from 'reporting-sdk-js';
import { JsonSchema } from '../../lib/jsonSchema';

const figureSchema: JsonSchema<templates.Figure> = {
  type: 'object',
  required: ['type', 'data', 'params'],
  properties: {
    type: {
      type: 'string',
    },
    data: {
      type: ['string', 'array'],
    },
    params: {
      type: 'object',
    },
    slots: {
      type: ['array', 'null', 'undefined'],
      items: {
        type: 'number',
      },
    },
  },
};

export const layoutSchema: JsonSchema<templates.Layout> = {
  type: 'object',
  required: ['figures'],
  properties: {
    data: {
      // @ts-ignore
      type: 'any',
    },
    fetcher: {
      type: ['string', 'null', 'undefined'],
    },
    fetchOptions: {
      type: ['object', 'null', 'undefined'],
    },
    figures: {
      type: 'array',
      items: figureSchema,
    },
  },
};

export const templateSchema: JsonSchema<templates.FullTemplate['template']> = {
  type: 'object',
  required: ['layouts'],
  properties: {
    renderer: {
      type: ['string', 'null', 'undefined'],
    },
    renderOptions: {
      type: ['object', 'null', 'undefined'],
    },
    fetchOptions: {
      type: ['object', 'null', 'undefined'],
    },
    layouts: {
      type: 'array',
      items: layoutSchema,
    },
  },
};
