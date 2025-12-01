import type {
  TemplateTag,
  InputTemplateTag,
} from '~/modules/template-tags/types';

type TemplateTagMap = Map<string, TemplateTag | InputTemplateTag>;

export { type TemplateTag, type TemplateTagMap };
