import chai from 'chai';
import { templates } from 'reporting-sdk-js';
import type { JsonSchema } from '../../lib/jsonSchema';

const { expect } = chai;

const figureSchema: JsonSchema<templates.Figure> = {
  type: 'object',
  required: ['type', 'params'],
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

const minTemplateSchema: JsonSchema<templates.Template> = {
  type: 'object',
  required: ['name', 'renderer', 'pageCount'],
  properties: {
    name: {
      type: 'string',
    },
    renderer: {
      type: 'string',
    },
    pageCount: {
      type: 'number',
    },
  },
};

export default () => {
  describe('getAllTemplates()', () => {
    let res: ReturnType<typeof templates.getAllTemplates> | undefined;

    it('should return array of template', async () => {
      if (!res) {
        res = templates.getAllTemplates();
      }
      const { content } = await res;

      expect(content).to.be.jsonSchema({
        type: 'array',
        items: minTemplateSchema,
      });
    });
  });

  describe('getTemplate(<string>)', () => {
    let res: ReturnType<typeof templates.getTemplate> | undefined;

    it('should return template', async () => {
      if (!res) {
        res = templates.getTemplate('basic');
      }
      const { content } = await res;

      expect(content).to.be.jsonSchema({
        type: 'object',
        required: [...(minTemplateSchema as Required<typeof minTemplateSchema>).required, 'template'],
        properties: {
          ...(minTemplateSchema as Required<typeof minTemplateSchema>).properties,
          template: templateSchema,
        },
      });
    });
  });
};
