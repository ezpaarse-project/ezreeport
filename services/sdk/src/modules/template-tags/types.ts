/**
 * Tag of a template
 */
export interface TemplateTag {
  /** Tag id */
  id: string;
  /** Tag name */
  name: string;
  /** Tag color. Should be in hex format */
  color?: string;
}

/**
 * Data needed to create/edit a tag
 */
export type InputTemplateTag = Omit<TemplateTag, 'id'>;
