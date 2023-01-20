import axios from 'axios';
import type { Font } from 'jspdf';
import { marked } from 'marked';
import { lookup } from 'mime-types';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import config from '~/lib/config';
import type { PDFReport } from '.';
import { loadImageAsset } from './utils';

const { assetsDir } = config.get('report');

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type MdType = 'header' | 'text' | 'break' | 'link' | 'image';

type MdParams = {
  start: Position
  width: number,
  height: number
};

export type InputMdParams = Omit<MdParams, 'width' | 'height' | 'start'>;

type MdElement = {
  type: MdType
  content: string
  meta: Partial<{
    level: HeadingLevel,
    fontStyle: 'bold' | 'italic' | 'bolditalic',
    fontDecoration: 'strike' | 'underline',
    fontColor: string,
    href: string,
    src: string,
    title: string,
    space: number,
  }>
};

type MdDefault = {
  cursor: Position,
  font: Font,
  fontSize: number
  fontColor: string
  drawColor: string
};

let elements: MdElement[] | undefined;

/**
 * Renderer that render Markdown as PDF text. Doesn't output any string.
 */
const renderer: marked.RendererObject = {
  code: (_code: string, _language: string | undefined, _isEscaped: boolean) => {
    if (!elements) throw new Error('figure not initialized');

    // TODO[feat]: support code blocks

    return '';
  },
  blockquote: (_quote: string) => {
    if (!elements) throw new Error('figure not initialized');

    // TODO[feat]: support quotes

    return '';
  },
  html: (_html: string) => {
    if (!elements) throw new Error('figure not initialized');

    // Skip it as `jsPDF.html()` is browser dependent...

    return '';
  },
  heading: (
    text: string,
    level: HeadingLevel,
    _raw: string,
    _slugger: marked.Slugger,
  ) => {
    if (!elements) throw new Error('figure not initialized');

    const element = elements.at(-1);
    if (element && element.type === 'text') {
      element.type = 'header';
      element.meta = {
        ...element.meta,
        level,
      };
    }

    return text;
  },
  hr: () => {
    if (!elements) throw new Error('figure not initialized');

    // TODO[feat]: support break (just print line)

    return '';
  },
  list: (_body: string, _ordered: boolean, _start: number) => {
    if (!elements) throw new Error('figure not initialized');

    // TODO[feat]: support lists

    return '';
  },
  listitem: (text: string, _task: boolean, _checked: boolean) => {
    if (!elements) throw new Error('figure not initialized');

    // TODO[feat]: support lists

    return text;
  },
  checkbox: (_checked: boolean) => {
    if (!elements) throw new Error('figure not initialized');

    // TODO[feat]: support checkbox

    return '';
  },
  /**
   * Print text found without any special formatting
   *
   * @param text The parsed text
   * @returns The parsed text
   */
  paragraph: (text: string) => {
    if (!elements) throw new Error('figure not initialized');

    const element = elements.at(-1);
    if (element?.type === 'image') {
      element.meta.space = 1;
    } else {
      elements.push({
        type: 'break',
        content: '',
        meta: {
          space: 2,
        },
      });
    }

    return text;
  },
  table: (_header: string, _body: string) => {
    if (!elements) throw new Error('figure not initialized');

    // TODO[feat]: support table

    return '';
  },
  tablerow: (_content: string) => {
    if (!elements) throw new Error('figure not initialized');

    // TODO[feat]: support table

    return '';
  },
  tablecell: (
    _content: string,
    _flags: {
      header: boolean;
      align: 'center' | 'left' | 'right' | null;
    },
  ) => {
    if (!elements) throw new Error('figure not initialized');

    // TODO[feat]: support table

    return '';
  },
  strong: (text: string) => {
    if (!elements) throw new Error('figure not initialized');

    const element = elements.at(-1);
    if (element) {
      element.meta = {
        ...element.meta,
        fontStyle: element.meta.fontStyle === 'italic' ? 'bolditalic' : 'bold',
      };
    }

    return text;
  },
  em: (text: string) => {
    if (!elements) throw new Error('figure not initialized');

    const element = elements.at(-1);
    if (element) {
      element.meta = {
        ...element.meta,
        fontStyle: element.meta.fontStyle === 'bold' ? 'bolditalic' : 'italic',
      };
    }

    // Returning the space taken by the new text
    return text;
  },
  codespan: (_code: string) => {
    if (!elements) throw new Error('figure not initialized');

    // TODO[feat]: support code blocks

    return '';
  },
  br: () => {
    if (!elements) throw new Error('figure not initialized');

    elements.push({
      type: 'break',
      content: '',
      meta: {},
    });

    return '';
  },
  del: (text: string) => {
    if (!elements) throw new Error('figure not initialized');

    const element = elements.at(-1);
    if (element) {
      element.meta = {
        ...element.meta,
        fontDecoration: 'strike',
      };
    }

    return text;
  },
  link: (href: string | null, title: string | null, text: string) => {
    if (!elements) throw new Error('figure not initialized');

    const element = elements.at(-1);
    if (element) {
      if (element.type === 'text') {
        element.type = 'link';
        element.meta = {
          ...element.meta,
          href: href ?? undefined,
          title: title ?? undefined,
        };
      } else if (element.type === 'image') {
        element.meta.href = href ?? undefined;
      } else {
        elements.push({
          type: 'link',
          content: '',
          meta: {
            href: href ?? undefined,
            title: title ?? undefined,
          },
        });
      }
    }

    return text;
  },
  image: (href: string | null, title: string | null, text: string) => {
    if (!elements) throw new Error('figure not initialized');

    elements.push({
      type: 'image',
      content: '',
      meta: {
        title: title ?? undefined,
        src: href ?? undefined,
      },
    });

    return text;
  },
  text: (text: string) => {
    if (!elements) throw new Error('figure not initialized');

    elements.push({
      type: 'text',
      content: text,
      meta: {},
    });

    return text;
  },
};

marked.use({ renderer });

/**
 * Print element at cursor position. Auto breaks text if going to overflow.
 *
 * Moves cursor while running.
 *
 * @param params Various params
 *
 * @returns The size taken by the text
 */
const printText = (
  params: {
    /**
     * The element
     */
    element: MdElement,
    /**
     * Default values
     */
    def: MdDefault,
    /**
     * PDF instance
     */
    pdf: PDFReport['pdf'],
    /**
     * Start position
     */
    start: Position,
    /**
     * Current position.
     *
     * **Will be modified**
     */
    cursor: Position,
    /**
     * Maximum width
     */
    width: number
    /**
     * Override default fontSize
     */
    fontSize?: number,
  },
) => {
  const { element: { content, meta }, def, pdf } = params;
  let { fontSize } = params;
  if (!fontSize) fontSize = def.fontSize;

  const text = content.replace(/\n/g, '');

  pdf
    .setTextColor(meta.fontColor ?? 'black')
    .setFont(def.font.fontName, meta.fontStyle ?? def.font.fontStyle)
    .setFontSize(fontSize);

  let { w, h } = pdf.getTextDimensions(text);

  const isTooWide = params.cursor.x + w > params.start.x + params.width;
  if (!isTooWide) {
    // Print text
    const y = params.cursor.y + fontSize;
    pdf.text(text, params.cursor.x, y);

    if (meta.fontDecoration) {
      pdf.setDrawColor(meta.fontColor ?? 'black');
      switch (meta.fontDecoration) {
        case 'strike':
          pdf.line(params.cursor.x - 2, y - (h / 3), params.cursor.x + w + 2, y - (h / 3));
          break;

        case 'underline': // FIXME: Not handled by marked (?)
          pdf.line(params.cursor.x - 2, y + 2, params.cursor.x + w + 2, y + 2);
          break;

        default:
          break;
      }
    }
  } else {
    // Print word per word to mimic CSS's property `word-break: break-word;`
    const words = text.split(' ');
    w = params.width;
    for (let i = 0; i < words.length; i += 1) {
      let word = words[i];
      word = (i !== 0 ? ' ' : '') + word.trim();

      const wordW = pdf.getTextWidth(word);
      if (wordW > params.width) {
        throw new Error(`Word "${word.trim()}" is too long to be printed.`);
      }

      if (params.cursor.x + wordW > params.start.x + params.width) {
        // eslint-disable-next-line no-param-reassign
        params.cursor.x = params.start.x;
        // eslint-disable-next-line no-param-reassign
        params.cursor.y += 1.5 * fontSize;
        h += 1.5 * fontSize;
        word = word.trimStart();
      }

      const { width: writedW } = printText({
        ...params,
        element: { ...params.element, content: word },
      });
      // eslint-disable-next-line no-param-reassign
      params.cursor.x += writedW;
    }
  }

  return { width: w, height: h, isTooWide };
};

/**
 * Print element as a image at cursor position.
 *
 * @param params Various params
 *
 * @returns The size taken by the image
 */
const printImage = async (
  params: {
    /**
     * Metadata of image
     */
    meta: { src: string, href?: string }
    /**
     * PDF instance
     */
    pdf: PDFReport['pdf'],
    /**
     * Current position.
     */
    cursor: Position,
  },
): Promise<Size | undefined> => {
  const { meta, pdf, cursor } = params;

  let imageData = '';
  if (meta.src.match(/^https?:\/\//i)) {
    // Remote images
    const { data: file } = await axios.get(meta.src, { responseType: 'arraybuffer' });
    // TODO [fix]: What if not contained in URL ?
    const mime = lookup(meta.src);
    const raw = file.toString('base64');
    imageData = `data:${mime};base64,${raw}`;
  } else if (meta.src.match(/^data:/i)) {
    // Inline images
    imageData = meta.src;
  } else {
    // Local images
    const path = join('assets', meta.src);
    if (new RegExp(`^${assetsDir}/.*\\.json$`, 'i').test(path) === false) {
      throw new Error(`Md's image must be in the "${assetsDir}" folder. Resolved: "${path}"`);
    }
    const mime = lookup(path);
    if (!mime) throw new Error("Can't resolve mime type");
    // eslint-disable-next-line no-await-in-loop
    const raw = await readFile(path, 'base64');
    imageData = `data:${mime};base64,${raw}`;
  }

  if (imageData) {
    // eslint-disable-next-line no-await-in-loop
    const { width, height } = await loadImageAsset(imageData);
    // Max image size while keeping aspect ratio
    const w = Math.min(width, 200);
    const h = (height / width) * w;
    // Images start from original position
    pdf.addImage({
      imageData,
      x: cursor.x,
      y: cursor.y,
      width: w,
      height: h,
    });

    if (meta.href) {
      pdf.link(cursor.x, cursor.y, w, h, { url: meta.href });
    }

    return { width: w, height: h };
  }
  return undefined;
};

/**
 * Add text (as Markdown) to PDF
 *
 * @param doc The PDF report
 * @param data The data (the text to show)
 * @param params Other params
 */
export const addMdToPDF = async (
  doc: PDFReport,
  data: string,
  params: MdParams,
): Promise<void> => {
  elements = [];
  const def: MdDefault = {
    cursor: { ...params.start },
    font: doc.pdf.getFont(),
    fontSize: doc.pdf.getFontSize(),
    fontColor: doc.pdf.getTextColor(),
    drawColor: doc.pdf.getDrawColor(),
  };
  const cursor = { ...def.cursor };

  try {
    await marked.parse(data, { async: true });

    // eslint-disable-next-line no-restricted-syntax
    for (const element of elements) {
      const { type, content, meta } = element;
      let { fontSize } = def;

      switch (type) {
        case 'header': {
          fontSize = 48 / (meta.level ?? 1);
          // Heading start from original position
          cursor.x = def.cursor.x;
          const { height, isTooWide } = printText({
            fontSize,
            element,
            pdf: doc.pdf,
            def,
            start: params.start,
            width: params.width,
            cursor,
          });
          cursor.x = def.cursor.x;
          if (isTooWide) {
            cursor.y += 1.5 * fontSize;
          } else {
            cursor.y += 1.15 * height;
          }
          break;
        }

        case 'break': {
          // Next line will start from original position
          cursor.x = def.cursor.x;
          // Jump to next line (1.25 for next line)
          cursor.y += ((meta.space ?? 0) + 1.25) * def.fontSize;
          break;
        }

        case 'link': {
          const text = content.replace(/\n/g, '');
          const y = cursor.y + fontSize;
          const w = doc.pdf
            .setFont(def.font.fontName, meta.fontStyle ?? def.font.fontStyle)
            .setFontSize(fontSize)
            .setTextColor('blue')
            .setDrawColor('blue')
            .textWithLink(text, cursor.x, y, { url: meta.href });
          doc.pdf.line(cursor.x - 2, y + 2, cursor.x + w + 2, y + 2);
          cursor.x += w;
          break;
        }

        case 'image': {
          if (meta.src) {
            // eslint-disable-next-line no-await-in-loop
            const result = await printImage({
              meta: { ...meta, src: meta.src ?? '' },
              pdf: doc.pdf,
              cursor,
            });

            if (result) {
              if (meta.space) {
                cursor.x = def.cursor.x;
                cursor.y += result.height;
              } else {
                cursor.x += result.width;
              }
            }
          }
          break;
        }

        default: { // text
          const { width, isTooWide } = printText({
            element,
            pdf: doc.pdf,
            def,
            start: params.start,
            width: params.width,
            cursor,
          });
          if (!isTooWide) {
            // Calculate next offset
            cursor.x += width;
          }
          break;
        }
      }
    }

    // Reset colors/fonts before generating further pages
    doc.pdf
      .setTextColor(def.fontColor)
      .setDrawColor(def.drawColor)
      .setFont(def.font.fontName, def.font.fontStyle)
      .setFontSize(def.fontSize);

    elements = undefined;
  } catch (error) {
    elements = undefined;
    throw error;
  }
};
