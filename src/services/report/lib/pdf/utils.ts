import { Image } from 'canvas';
import type jsPDF from 'jspdf';

type Area = { x: number, y: number, width: number, height: number };

/**
 * Loads an image with some info
 *
 * @param data Image src
 * @return base64 & other usefull information
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
  };
  pdf
    .setFillColor(bg)
    .rect(area.x, area.y, area.width, area.height, 'F')
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
    .setFillColor(def.fill);
};
