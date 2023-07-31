import { marked } from 'marked';

import type { MdElement } from './elements/MdElement';
import * as Md from './elements';

export default class MdParser<T = never> extends marked.Renderer<T> {
  private elements: MdElement[] = [];

  private imagesToLoad: Md.MdImgElement['load'][] = [];

  constructor(
    private data: string,
    options?: marked.MarkedOptions,
  ) {
    super(options);
  }

  /**
   * Parse into MdElements ready to be rendered into PDF
   *
   * @returns The MdDocument
   */
  public async parse() {
    // Reset elements
    this.elements = [];
    this.imagesToLoad = [];

    // Parse using hooks
    await marked.parse(
      this.data,
      {
        async: true,
        mangle: false,
        headerIds: false,
        renderer: this,
      },
    );

    // Return elements
    return new Md.MdDocument(this.elements, this.imagesToLoad);
  }

  // Hooks

  // eslint-disable-next-line class-methods-use-this
  code(_code: string, _language: string | undefined, _isEscaped: boolean) {
    throw new Error('Code in MD are not supported');
    return '';
  }

  blockquote(quote: string) {
    const sanitizedQuote = Md.MdTextElement.sanitizeContent(quote);

    const children = [];
    let innerText = '';
    while (innerText !== sanitizedQuote && this.elements.length > 0) {
      const lastElement = this.elements.pop();
      if (typeof lastElement?.content === 'string') {
        innerText = `${lastElement.content}${innerText}`;

        children.unshift(lastElement);
      }
    }

    this.elements.push(new Md.MdQuoteElement(children));

    return quote;
  }

  // eslint-disable-next-line class-methods-use-this
  html(_html: string) {
    throw new Error('HTML in MD are not supported');
    return '';
  }

  heading(
    text: string,
    level: number,
    raw: string,
    _slugger: marked.Slugger,
  ) {
    const sanitizedRaw = Md.MdTextElement.sanitizeContent(raw);

    const children = [];
    let innerText = '';
    while (innerText !== sanitizedRaw && this.elements.length > 0) {
      const lastElement = this.elements.pop();
      if (typeof lastElement?.content === 'string') {
        innerText = `${lastElement.content}${innerText}`;

        children.unshift(lastElement);
      }
    }
    this.elements.push(
      new Md.MdHeadingElement(children, level as 1 | 2 | 3 | 4 | 5 | 6),
    );

    return text;
  }

  hr() {
    this.elements.push(new Md.MdHrElement());

    return '';
  }

  list(body: string, ordered: boolean, start: number) {
    const sanitizedBody = Md.MdTextElement.sanitizeContent(body);

    const children = [];
    let innerText = '';
    while (innerText !== sanitizedBody && this.elements.length > 0) {
      const lastElement = this.elements.pop();

      // Limit children to ListItem elements
      if (!(lastElement instanceof Md.MdListItemElement)) {
        if (lastElement) {
          this.elements.push(lastElement);
        }
        break;
      }

      innerText = `${lastElement.content}${innerText}`;
      children.unshift(lastElement);
    }

    this.elements.push(new Md.MdListElement(children, ordered, start));

    return body;
  }

  listitem(text: string, _task: boolean, _checked: boolean) {
    const sanitizedText = Md.MdTextElement.sanitizeContent(text);

    const children = [];
    const subLists = [];
    let innerText = '';
    while (innerText !== sanitizedText && this.elements.length > 0) {
      const lastElement = this.elements.pop();
      if (typeof lastElement?.content === 'string') {
        innerText = `${lastElement.content}${innerText}`;

        if (lastElement instanceof Md.MdListElement) {
          subLists.unshift(lastElement);
        } else {
          children.unshift(lastElement);
        }
      }
    }

    this.elements.push(new Md.MdListItemElement(children, subLists));

    return text;
  }

  // eslint-disable-next-line class-methods-use-this
  checkbox(_checked: boolean) {
    // TODO[feat]: support checkbox

    return '';
  }

  paragraph(text: string) {
    const sanitizedText = Md.MdTextElement.sanitizeContent(text);

    const children = [];
    let innerText = '';
    while (innerText !== sanitizedText && this.elements.length > 0) {
      const lastElement = this.elements.pop();
      if (typeof lastElement?.content === 'string') {
        innerText = `${lastElement.content}${innerText}`;

        children.unshift(lastElement);
      }
    }

    this.elements.push(new Md.MdParagraphElement(children));

    return text;
  }

  // eslint-disable-next-line class-methods-use-this
  table(_header: string, _body: string) {
    throw new Error('Tables in MD are not supported');

    return '';
  }

  // eslint-disable-next-line class-methods-use-this
  tablerow(_content: string) {
    throw new Error('Tables in MD are not supported');

    return '';
  }

  // eslint-disable-next-line class-methods-use-this
  tablecell(
    _content: string,
    _flags: {
      header: boolean;
      align: 'center' | 'left' | 'right' | null;
    },
  ) {
    throw new Error('Tables in MD are not supported');

    return '';
  }

  strong(text: string) {
    const sanitizedText = Md.MdTextElement.sanitizeContent(text);

    const boldElements = [];
    let innerText = '';
    while (innerText !== sanitizedText && this.elements.length > 0) {
      const lastElement = this.elements.pop();
      const content = typeof lastElement?.content === 'string' ? lastElement.content : text;
      innerText = `${content}${innerText}`;

      boldElements.unshift(
        new Md.MdStrongElement(
          content,
          lastElement instanceof Md.MdEmElement,
        ),
      );
    }
    this.elements.push(...boldElements);

    return text;
  }

  em(text: string) {
    const sanitizedText = Md.MdTextElement.sanitizeContent(text);

    const italicElements = [];
    let innerText = '';
    while (innerText !== sanitizedText && this.elements.length > 0) {
      const lastElement = this.elements.pop();
      const content = typeof lastElement?.content === 'string' ? lastElement.content : text;
      innerText = `${content}${innerText}`;

      italicElements.unshift(
        new Md.MdEmElement(
          content,
          lastElement instanceof Md.MdStrongElement,
        ),
      );
    }
    this.elements.push(...italicElements);

    return text;
  }

  // eslint-disable-next-line class-methods-use-this
  codespan(_code: string) {
    throw new Error('Tables in MD are not supported');
    return '';
  }

  // eslint-disable-next-line class-methods-use-this
  br() {
    return '';
  }

  del(text: string) {
    const sanitizedText = Md.MdTextElement.sanitizeContent(text);

    const children = [];
    let innerText = '';
    while (innerText !== sanitizedText && this.elements.length > 0) {
      const lastElement = this.elements.pop();
      if (typeof lastElement?.content === 'string') {
        innerText = `${lastElement.content}${innerText}`;

        children.unshift(lastElement);
      }
    }

    this.elements.push(new Md.MdDelElement(children));

    return text;
  }

  link(href: string | null, title: string | null, text: string) {
    const textSanitized = Md.MdTextElement.sanitizeContent(text);

    const children = [];
    let innerText = '';
    while (innerText !== textSanitized && this.elements.length > 0) {
      const lastElement = this.elements.pop();
      if (typeof lastElement?.content === 'string') {
        innerText = `${lastElement.content}${innerText}`;

        children.unshift(lastElement);
      }
    }
    this.elements.push(
      new Md.MdLinkElement(href || '', children),
    );

    return text;
  }

  image(href: string | null, _title: string | null, _text: string) {
    const imgEl = new Md.MdImgElement(href ?? '');
    this.elements.push(imgEl);
    this.imagesToLoad.push(() => imgEl.load());

    return Md.MdImgElement.contentPlaceholder;
  }

  text(text: string) {
    this.elements.push(
      new Md.MdTextElement(
        text,
      ),
    );

    return text;
  }
}
