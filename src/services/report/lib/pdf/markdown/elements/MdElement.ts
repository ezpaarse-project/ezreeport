/* eslint-disable max-classes-per-file */
import type { Font, jsPDF } from 'jspdf';

export type MdDefault = {
  cursor: Position,
  font: Font,
  fontSize: number
  fontColor: string
  drawColor: string
};

export type MdFontStyle = 'bold' | 'italic' | 'bolditalic';

export type MdRenderResult = Size & { lastLine: Size, isBlock?: boolean };

export abstract class MdElement<T = unknown> {
  protected cursor: Position;

  protected marginBottom = 0;

  constructor(
    private _content: T,
    protected children: MdElement[] = [],
  ) {
    this.cursor = { x: 0, y: 0 };
  }

  public get content(): T | string {
    if (this._content != null) {
      return this._content;
    }

    return this.children.map(
      (el) => el.content,
    ).join('');
  }

  protected set content(value: T) {
    this._content = value;
  }

  abstract render(
    pdf: jsPDF,
    def: MdDefault,
    start: Position,
    edge: Area,
  ): MdRenderResult;
}
