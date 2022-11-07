import { Font } from 'jspdf';
import { marked } from 'marked';
import type { PDFReport } from './pdf';

// TODO[feat]: Break lines

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type MdType = 'header' | 'text' | 'break' | 'link';

export type MdParams = {

};

type MdElement = {
  type: MdType
  content: string
  meta: Partial<{
    level: HeadingLevel,
    fontStyle: 'bold' | 'italic' | 'bolditalic',
    fontDecoration: 'strike' | 'underline',
    fontColor: string,
    href: string,
    title: string,
    space: number
  }>
};

type MdDefault = {
  cursor: Position,
  font: Font,
  fontSize: number
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
    if (element) {
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

    elements.push({
      type: 'break',
      content: '',
      meta: {
        space: 2,
      },
    });

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
      // FIXME: image with links

      element.type = 'link';
      element.meta = {
        ...element.meta,
        href: href ?? undefined,
        title: title ?? undefined,
      };
    }

    return text;
  },
  image: (href: string | null, title: string | null, text: string) => {
    if (!elements) throw new Error('figure not initialized');

    // TODO[feat]: support images

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

// TODO[doc]
/**
 *
 * @param pdf
 * @param param1
 * @param cursor
 * @param defValues
 * @param fontSize
 * @returns
 */
const printText = (
  pdf: PDFReport['pdf'],
  { content, meta }: MdElement,
  cursor: Position,
  defValues: MdDefault,
  fontSize = defValues.fontSize,
) => {
  // TODO[feat]: handle breaks
  const text = content.replace(/\n/g, '');
  pdf
    .setTextColor(meta.fontColor ?? 'black')
    .setFont(defValues.font.fontName, meta.fontStyle ?? defValues.font.fontStyle)
    .setFontSize(fontSize)
    .text(text, cursor.x, cursor.y);

  const { w, h } = pdf.getTextDimensions(text);

  if (meta.fontDecoration) {
    pdf.setDrawColor(meta.fontColor ?? 'black');
    switch (meta.fontDecoration) {
      case 'strike':
        pdf.line(cursor.x - 2, cursor.y - (h / 3), cursor.x + w + 2, cursor.y - (h / 3));
        break;

      case 'underline': // FIXME: Not handled by marked (?)
        pdf.line(cursor.x - 2, cursor.y + 2, cursor.x + w + 2, cursor.y + 2);
        break;

      default:
        break;
    }
  }

  return { width: w, height: h };
};

marked.use({ renderer });

export const addMdToPDF = async (
  doc: PDFReport,
  data: string,
  _params: MdParams,
): Promise<void> => {
  elements = [];
  const def: MdDefault = {
    cursor: {
      x: doc.offset.left,
      y: doc.offset.top,
    },
    font: doc.pdf.getFont(),
    fontSize: doc.pdf.getFontSize(),
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
          // Heading have a space before them...
          cursor.y += fontSize + def.fontSize;
          printText(doc.pdf, element, cursor, def, fontSize);
          // ... and after them (2 for space and 1.25 for next line)
          cursor.y += 3.25 * def.fontSize;
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
          const w = doc.pdf
            .setFont(def.font.fontName, meta.fontStyle ?? def.font.fontStyle)
            .setFontSize(fontSize)
            .setTextColor('blue')
            .setDrawColor('blue')
            .textWithLink(text, cursor.x, cursor.y, { url: meta.href });
          doc.pdf.line(cursor.x - 2, cursor.y + 2, cursor.x + w + 2, cursor.y + 2);
          cursor.x += w;
          break;
        }

        default: { // text
          printText(doc.pdf, element, cursor, def);
          // Calculate next offset
          cursor.x += doc.pdf.getTextWidth(content);
          break;
        }
      }
    }

    // Reset colors before generation further pages
    doc.pdf.setTextColor('black').setDrawColor('black');

    elements = undefined;
  } catch (error) {
    elements = undefined;
    throw error;
  }
};
