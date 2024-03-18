import { Image } from 'canvas';
import jsPDF from 'jspdf';

import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

type Area = { x: number, y: number, width: number, height: number };

/**
 * Loads an image with some info
 *
 * @param data Image src
 * @return base64 & other useful information
 */
export const loadImageAsset = async (
  data: string,
): Promise<{ data: string; width: number; height: number }> => {
  // Waiting Image to "render" to get width & height
  const img = await new Promise<Image>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = data;
  });
  return {
    data: img.src.toString(),
    width: img.width,
    height: img.height,
  };
};

/**
 * Print background & markers of an area. Design for debug purposes, do not use in prod.
 *
 * @param pdf The PDF
 * @param area The area
 * @param bg The background color (default: green)
 * @param marks The mark color (default: red)
 * @param markWidth The mark width (default: 1)
 */
// eslint-disable-next-line import/prefer-default-export
export const drawAreaRef = (pdf: jsPDF, area: Area, bg = 'green', marks = 'red', markWidth = 1) => {
  const def = {
    fill: pdf.getFillColor(),
    font: pdf.getFont(),
    fontSize: pdf.getFontSize(),
    textColor: pdf.getTextColor(),
  };
  pdf
    // Background
    .setFillColor(bg)
    .rect(area.x, area.y, area.width, area.height, 'F')
    // Marks
    .setFillColor(marks)
    .rect(
      area.x,
      area.y + Math.round(area.height / 2),
      area.width,
      markWidth,
      'F',
    )
    .rect(
      area.x + Math.round(area.width / 2),
      area.y,
      markWidth,
      area.height,
      'F',
    )
    // JSON
    .setFontSize(7)
    .setFont(def.font.fontName, 'bold')
    .setTextColor(marks)
    .text(
      JSON.stringify(area),
      area.x,
      area.y + area.height + 12,
    )
    // Reset
    .setFillColor(def.fill)
    .setTextColor(def.textColor)
    .setFont(def.font.fontName, def.font.fontStyle)
    .setFontSize(def.fontSize);
};

/**
 * Schedule a font to be registered in JSPDF
 *
 * @param path Path to the `.ttf` file
 * @param name The name of the font
 * @param fontStyle The style of the font
 * @param fontWeight The weight of the font
 */
export const registerJSPDFFont = async (
  path: string,
  fontFace: {
    family: string,
    style?: string,
    weight?: string | number,
  },
) => {
  const { family, style = '', weight = '' } = fontFace;

  const font = await readFile(path, 'base64');
  const fontStyle = `${weight}${style}` || 'normal';
  const fileName = basename(path);

  const callAddFont = function callAddFont(this: jsPDF) {
    this
      .addFileToVFS(fileName, font)
      .addFont(fileName, family, fontStyle);
  };

  jsPDF.API.events.push(['addFonts', callAddFont]);
};
