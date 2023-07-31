import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { jsPDF } from 'jspdf';
import axios from 'axios';
import { lookup } from 'mime-types';

import config from '~/lib/config';
import { loadImageAsset } from '~/lib/pdf/utils';

import { type MdDefault, MdElement, type MdRenderResult } from './MdElement';

const { assetsDir } = config.get('report');

type MdImgMeta = {
  height: number,
  width: number,
};

export default class MdImgElement extends MdElement<string> {
  static contentPlaceholder = '<!-- <img to load> -->';

  private meta: MdImgMeta | undefined;

  constructor(
    private src: string,
  ) {
    super(MdImgElement.contentPlaceholder);
  }

  private async fetchRemote() {
    console.log(`fetching [${this.src}]`);

    const { data: file, headers } = await axios.get(this.src, { responseType: 'arraybuffer' });

    let mime: string = headers['Content-Type'] || headers['content-type'];
    if (!mime) {
      mime = lookup(this.src) || '';
    }
    if (!mime) {
      throw new Error(`Cannot resolve MIME type of [${this.src}]`);
    }

    const raw = file.toString('base64');
    this.content = `data:${mime};base64,${raw}`;
  }

  private async fetchLocal() {
    const path = join('assets', this.src);
    if (new RegExp(`^${assetsDir}/.*$`, 'i').test(path) === false) {
      throw new Error(`Md's image must be in the "${assetsDir}" folder. Resolved: "${path}"`);
    }

    console.log(`loading [${path}]`);

    const mime = lookup(path);
    if (!mime) {
      throw new Error(`Cannot resolve MIME type of [${this.src}]`);
    }

    const raw = await readFile(path, 'base64');
    this.content = `data:${mime};base64,${raw}`;
  }

  isLoaded() {
    return this.content !== MdImgElement.contentPlaceholder;
  }

  isLocal() {
    return !this.isInline() && !this.isRemote();
  }

  isInline() {
    return /^data:/i.test(this.src);
  }

  isRemote() {
    return /^https?:\/\//i.test(this.src);
  }

  async load() {
    if (this.isLoaded()) {
      return {
        ...this.meta,
        data: this.content,
      };
    }

    if (this.isRemote()) {
      await this.fetchRemote();
    }

    if (this.isLocal()) {
      await this.fetchLocal();
    }

    if (this.isInline()) {
      this.content = this.src;
    }

    const meta = await loadImageAsset(this.content);
    this.meta = {
      height: meta.height,
      width: meta.width,
    };
    return meta;
  }

  render(
    pdf: jsPDF,
    _def: MdDefault,
    start: Position,
    _edge: Area,
  ): MdRenderResult {
    if (!this.isLoaded() || !this.meta) {
      throw new Error('Please load image first');
    }

    // Max image size while keeping aspect ratio
    const w = Math.min(this.meta.width, 200);
    const h = (this.meta.height / this.meta.width) * w;

    pdf.addImage({
      imageData: this.content,
      x: start.x,
      y: start.y,
      width: w,
      height: h,
    });

    return {
      height: h,
      width: w,
      lastLine: {
        height: h,
        width: w,
      },
    };
  }
}
