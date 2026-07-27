import type {
  InputTemplateTag,
  TemplateTag,
} from '~/modules/template-tags/types';

type TemplateTagMap = Map<string, TemplateTag | InputTemplateTag>;

export { type TemplateTagMap };
export { type TemplateTag } from '~/modules/template-tags/types';
