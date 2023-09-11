import type { Font } from 'jspdf';
import type { PDFReport } from '.';
import { format, isValid, parseISO } from '../date-fns';

type MetricParams = {
  // Auto fields
  start: Position,
  width: number,
  height: number,
  // Figure specific
  labels?: {
    dataKey: string,
    text?: string,
    field?: string,
    format?: {
      type: 'date' | 'number',
      params?: string[]
    }
  }[]
};

export type InputMetricParams = Omit<MetricParams, 'width' | 'height' | 'start'>;

type BasicMetricData = {
  key: string,
  value: number | string
};

type ComplexMetricData = Record<string, BasicMetricData['value'] | Record<string, BasicMetricData['value']>>;

export type MetricData = BasicMetricData[] | ComplexMetricData;

type MetricDefault = {
  font: Font,
  fontSize: number
};

/**
 * Format given value into date using given params
 *
 * @param origValue The value
 * @param params The params provided by the user
 *
 * @returns The date as a string
 */
const formatDate = (
  origValue: string | number | Record<string, string | number>,
  params: string[],
): string => {
  let value = origValue;
  if (typeof value === 'object') {
    throw new Error('Expected number / string, got Object');
  }

  if (typeof value === 'string') {
    const d = parseISO(value);
    if (!isValid(d)) throw new Error(`Date is not in ISO format: ${origValue}`);
    value = d.getTime();
  }

  return format(value, params[0] || 'dd/MM/yyyy');
};

/**
 * Format given value into number using given params
 *
 * @param origValue The value
 * @param params The params provided by the user
 *
 * @returns The number as a string
 */
const formatNumber = (
  origValue: string | number | Record<string, string | number>,
  params: string[],
): string => {
  let value = origValue;
  if (typeof value === 'object') {
    throw new Error('Expected number, got Object');
  }

  if (typeof value === 'string') {
    value = Number.parseInt(value, 10);
  }

  if (Number.isNaN(value)) {
    throw new Error(`Cannot parse value into a number: ${origValue}`);
  }

  const locale = {
    identifier: params[0] || 'fr-FR',
    params: {} as Intl.NumberFormatOptions,
    cb: (val: string) => val,
  };
  switch (locale.identifier) {
    case 'fr':
    case 'fr-FR':
      locale.identifier = 'en-US';
      locale.params.useGrouping = true;
      locale.cb = (val) => val
        .replace(/,/g, ' ')
        .replace(/\./g, ',');
      break;

    default:
      break;
  }

  value = value.toLocaleString(
    locale.identifier,
    locale.params,
  );

  return locale.cb(value);
};

/**
 * Apply style for printing value
 *
 * @param pdf The pdf
 * @param def The default values of pdf
 *
 * @returns The pdf
 */
const valueStyle = (pdf: PDFReport['pdf'], def: MetricDefault): PDFReport['pdf'] => pdf
  .setFontSize(21)
  .setFont(def.font.fontName, 'bold');

/**
 * Apply style for printing key
 *
 * @param pdf The pdf
 * @param def The default values of pdf
 *
 * @returns The pdf
 */
const keyStyle = (pdf: PDFReport['pdf'], def: MetricDefault): PDFReport['pdf'] => pdf
  .setFontSize(14)
  .setFont(def.font.fontName, def.font.fontStyle);

/**
 * Add metric figure to PDF
 *
 * @param doc The PDF report
 * @param inputData The data
 * @param params Other params
 */
export const addMetricToPDF = (doc: PDFReport, inputData: MetricData, params: MetricParams) => {
  const def: MetricDefault = {
    font: doc.pdf.getFont(),
    fontSize: doc.pdf.getFontSize(),
  };

  if ((params.labels?.length ?? 0) <= 0) {
    throw new Error('Metric figure must have at least one label');
  }

  let rawData = [];
  if (Array.isArray(inputData)) {
    rawData = inputData;
  } else {
    let dataKeys = Object.keys(inputData);
    const labelPositionMap = new Map(params.labels?.map(({ dataKey }, i) => [dataKey, i]) ?? []);

    // Remove unused data
    dataKeys = dataKeys.filter((dataKey) => labelPositionMap.has(dataKey));
    if (dataKeys.length <= 0) {
      throw new Error('No used dataKeys found');
    }

    // Sort metrics by label position
    dataKeys.sort((a, b) => (labelPositionMap.get(a) ?? 0) - (labelPositionMap.get(b) ?? 0));

    // eslint-disable-next-line no-restricted-syntax
    for (const key of dataKeys) {
      const label = params.labels?.find(({ dataKey }) => dataKey === key);
      let value = inputData[key];
      if (typeof value === 'object') {
        value = value[label?.field || 'value'];
      }

      try {
        if (label?.format) {
          const formatParams = label.format.params ?? [];
          switch (label.format.type) {
            case 'date':
              value = formatDate(value, formatParams);
              break;

            case 'number':
              value = formatNumber(value, formatParams);
              break;

            default:
              break;
          }
        }
      } catch (error) {
        if (!(error instanceof Error)) {
          throw new Error(`An unexpected error occurred wile formatting "${key}" ("${value}"): ${error}`);
        }
        error.message = `An error occurred wile formatting "${key}" ("${value}"): ${error.message}`;
        throw error;
      }

      if (value) {
        rawData.push({
          key: label?.text ?? key,
          value,
        });
      }
    }
  }

  const margin = { x: doc.margin.left, y: doc.margin.top, key: 3 };
  const cell: Size = { width: 0, height: 0 };
  // Calc size of each text + size of cell
  const data = rawData.map(({ key, value }) => {
    const str = value.toString();
    const sizes = {
      key: keyStyle(doc.pdf, def).getTextDimensions(key),
      value: valueStyle(doc.pdf, def).getTextDimensions(str),
    };
    cell.width = Math.max(cell.width, Math.max(sizes.key.w, sizes.value.w));
    cell.height = Math.max(cell.height, sizes.key.h + sizes.value.h + margin.key);
    return {
      key,
      value: str,
      sizes,
    };
  });

  const slots: Area[] = [];
  const cursor: Position = {
    x: 0,
    y: 0,
  };

  // Calc positions of cells
  const counts = {
    cols: Math.floor(params.width / (cell.width + margin.x)),
    // Will be calculated later since we need cols
    rows: 0,
  };
  counts.rows = Math.ceil(data.length / counts.cols);

  for (let row = 0; row < counts.rows; row += 1) {
    cursor.x = 0;

    for (let col = 0; col < counts.cols; col += 1) {
      slots.push({
        ...cell,
        x: cursor.x,
        y: cursor.y,
      });

      cursor.x += cell.width + margin.x;
    }

    cursor.y += cell.height + margin.y;
  }

  const totalSize: Size = {
    width: (counts.cols * cell.width) + ((counts.cols - 1) * margin.x),
    height: (counts.rows * cell.height) + ((counts.rows - 1) * margin.y),
  };

  const offset: Position = {
    x: params.start.x + (params.width / 2) - (totalSize.width / 2),
    y: params.start.y + (params.height / 2) - (totalSize.height / 2),
  };

  // Print data
  for (let i = 0; i < data.length; i += 1) {
    const { key, value, sizes } = data[i];
    if (!slots[i]) {
      throw new Error(`slot ${i} not found`);
    }

    const slot = {
      ...slots[i],
      x: offset.x + slots[i].x,
      y: offset.y + slots[i].y,
    };

    let y = slot.y + sizes.value.h - 5;
    valueStyle(doc.pdf, def).text(
      value,
      slot.x + Math.round(slot.width / 2),
      y,
      { align: 'center' },
    );
    y += sizes.key.h + margin.key;
    keyStyle(doc.pdf, def).text(
      key,
      slot.x + Math.round(slot.width / 2),
      y,
      { align: 'center' },
    );
  }

  // Reset colors/fonts before generating further pages
  doc.pdf
    .setFont(def.font.fontName, def.font.fontStyle)
    .setFontSize(def.fontSize);
};
